import { ClientNode, Endpoint, CommissioningClient } from '@matter/main'
import { BasicInformationClient } from '@matter/main/behaviors/basic-information'
import { BridgedDeviceBasicInformationClient } from '@matter/main/behaviors/bridged-device-basic-information'
import { DescriptorClient } from '@matter/main/behaviors/descriptor'
import { Accessory, DeviceType } from '../../shared/types/device'
import { makeAccessoryId } from '../../shared/accessory-id'
import { OnOffControl } from './controls/on-off-control'
import { storageService } from './storage'
import { getDefaultRoomAssignment } from '../../shared/default-room'
import { roomIdFromName, roomNameFromMatterTags, MatterSemanticTag } from '../../shared/matter-room'

export function rawDeviceType(deviceType: number): DeviceType {
  switch (deviceType) {
    case 0x010A:
    case 0x010B:
      return 'plug'
    case 0x0301:
    case 0x0302:
    case 0x002B:
      return 'climate'
    case 0x0022:
    case 0x0024:
      return 'speaker'
    case 0x000A:
    case 0x0015:
    case 0x0016:
      return 'security'
    case 0x0100:
    case 0x0101:
    case 0x010C:
    case 0x010D:
    default:
      return 'light'
  }
}

export function endpointDeviceType(endpoint: Endpoint): DeviceType {
  let deviceType: DeviceType = 'light'
  const desc = endpoint.maybeStateOf(DescriptorClient)
  if (desc?.deviceTypeList?.length) {
    deviceType = rawDeviceType(desc.deviceTypeList[0].deviceType as number)
  }
  return deviceType
}

export function getNodeFriendlyName(node: ClientNode): string {
  let friendlyName = 'Unknown Device'
  try {
    const biState = node.stateOf(BasicInformationClient)
    friendlyName = biState.productName || biState.nodeLabel || 'Unknown Device'
  } catch {
    friendlyName = node.id || 'Unknown Device'
  }
  return friendlyName
}

export function getRoomIdForEndpoint(accessoryId: string, endpoint: Endpoint): string {
  const descriptor = endpoint.maybeStateOf(DescriptorClient) as { tagList?: unknown[] } | undefined
  const matterRoomName = roomNameFromMatterTags(descriptor?.tagList as MatterSemanticTag[])
  if (matterRoomName) {
    const roomId = roomIdFromName(matterRoomName)
    if (roomId) return roomId
  }

  return storageService.getRoomAssignment(accessoryId) ?? getDefaultRoomAssignment()
}

export function persistRoomFromEndpoint(accessoryId: string, endpoint: Endpoint): void {
  const descriptor = endpoint.maybeStateOf(DescriptorClient) as { tagList?: unknown[] } | undefined
  const matterRoomName = roomNameFromMatterTags(descriptor?.tagList as MatterSemanticTag[])
  if (matterRoomName) {
    const roomId = roomIdFromName(matterRoomName)
    if (roomId) {
      storageService.addRoom(roomId, matterRoomName)
      storageService.setRoomAssignment(accessoryId, roomId)
    }
  }
}

export function controllableEndpoints(node: ClientNode): Endpoint[] {
  const onOff = new OnOffControl(node)
  return node.endpoints.filter(endpoint =>
    Number(endpoint.number) !== 0
    && endpoint.maybeStateOf(DescriptorClient) !== undefined
    && onOff.findEndpoint(Number(endpoint.number)) !== undefined
  )
}

export abstract class BaseDeviceHandler {
  abstract readonly deviceType: DeviceType

  async buildAccessory(node: ClientNode, endpoint: Endpoint, bridgeLike: boolean): Promise<Accessory> {
    const endpointNumber = Number(endpoint.number)
    const id = makeAccessoryId(node.id, endpointNumber)
    const nodeName = getNodeFriendlyName(node)
    const bridgedInfo = endpoint.maybeStateOf(BridgedDeviceBasicInformationClient)

    const defaultName = bridgedInfo?.nodeLabel || bridgedInfo?.productName
      || (bridgeLike ? `${nodeName} ${endpointNumber}` : nodeName)
    const friendlyName = storageService.getCustomName(id) ?? defaultName
    const isReachable = bridgedInfo?.reachable ?? node.maybeStateOf(CommissioningClient)?.peerAddress !== undefined
    const isFavorite = storageService.getFavorites().includes(id)
    const roomId = getRoomIdForEndpoint(id, endpoint)
    const onOff = new OnOffControl(node)
    const supportsOnOff = onOff.findEndpoint(endpointNumber) !== undefined
    const isOn = supportsOnOff ? (await onOff.getState(endpointNumber)) ?? false : false

    const extra = await this.fetchExtra(node, endpoint, friendlyName)

    return {
      id,
      nodeId: node.id,
      endpointNumber,
      bridgeId: bridgeLike ? node.id : undefined,
      bridgeName: bridgeLike ? nodeName : undefined,
      friendlyName,
      roomId,
      isOn,
      isFavorite,
      isReachable,
      deviceType: this.deviceType,
      supportsOnOff,
      ...extra,
    }
  }

  protected abstract fetchExtra(
    node: ClientNode,
    endpoint: Endpoint,
    friendlyName: string
  ): Promise<Partial<Accessory>>

  abstract subscribe(node: ClientNode, endpoint: Endpoint, onUpdate: () => void): void
}

const handlers = new Map<string, BaseDeviceHandler>()
let defaultHandler: BaseDeviceHandler | null = null

export const DeviceHandlerRegistry = {
  register(type: string, handler: BaseDeviceHandler): void {
    handlers.set(type, handler)
  },

  registerDefault(handler: BaseDeviceHandler): void {
    defaultHandler = handler
  },

  get(type: string): BaseDeviceHandler {
    return handlers.get(type) ?? defaultHandler!
  },
}
