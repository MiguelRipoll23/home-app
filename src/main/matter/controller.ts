import { ServerNode, ClientNode, ControllerBehavior, CommissioningClient, VendorId, Seconds } from '@matter/main'
import { BridgedDeviceBasicInformationClient } from '@matter/main/behaviors/bridged-device-basic-information'
import { ScenesManagementClient } from '@matter/main/behaviors/scenes-management'
import { OnOffClient } from '@matter/main/behaviors/on-off'
import { IdentifyClient } from '@matter/main/behaviors/identify'
import { Endpoint } from '@matter/main'

import { Accessory, BridgeInfo, DiscoveredDevice } from '../../shared/types/device'
import { Scene } from '../../shared/types/scene'
import { storageService } from './storage'
import { ScannerSet, CommissionableDevice } from '@matter/protocol'
import { OnOffControl } from './controls/on-off-control'
import { LevelControl } from './controls/level-control'
import { ColorControl } from './controls/color-control'
import { parseAccessoryId } from '../../shared/accessory-id'
import { endpointDeviceType, controllableEndpoints, DeviceHandlerRegistry, persistRoomFromEndpoint, getNodeFriendlyName } from './device-handler'
import { makeAccessoryId } from '../../shared/accessory-id'

export interface IMatterController {
  start(): Promise<void>
  discoverCommissionableDevices(): Promise<DiscoveredDevice[]>
  toggleDevice(deviceId: string): Promise<boolean>
  setDeviceOn(deviceId: string, on: boolean): Promise<boolean>
  setDeviceBrightness(deviceId: string, level: number): Promise<void>
  setDeviceColor(deviceId: string, color: { hue: number; saturation: number }): Promise<void>
  pairDevice(pairingCode: string): Promise<Accessory>
  pairDiscoveredDevice(identifier: Record<string, unknown>, passcode: number): Promise<Accessory>
  identifyDevice(deviceId: string): Promise<void>
  setDeviceName(deviceId: string, name: string): Promise<void>
  setDeviceRoom(deviceId: string, roomId: string): Promise<void>
  getBridges(): Promise<BridgeInfo[]>
  removeBridge(bridgeId: string): Promise<void>
  getScenes(): Promise<Scene[]>
  activateScene(sceneId: string): Promise<void>
  onUpdate(listener: (device: Accessory) => void): void
  getDevices(): Promise<Accessory[]>
  getDeviceState(deviceId: string): Promise<Accessory | null>
}

const ControllerRoot = ServerNode.RootEndpoint.with(ControllerBehavior) as ServerNode.RootEndpoint

async function nodeToAccessories(node: ClientNode): Promise<Accessory[]> {
  const endpoints = controllableEndpoints(node)
  const bridgeLike = endpoints.length > 1 || endpoints.some(endpoint => endpoint.maybeStateOf(BridgedDeviceBasicInformationClient) !== undefined)
  const accessories: Accessory[] = []
  for (const endpoint of endpoints) {
    const deviceType = endpointDeviceType(endpoint)
    const handler = DeviceHandlerRegistry.get(deviceType)
    accessories.push(await handler.buildAccessory(node, endpoint, bridgeLike))
  }
  return accessories
}

async function endpointScenes(node: ClientNode, endpoint: Endpoint): Promise<Scene[]> {
  const endpointNumber = Number(endpoint.number)
  const accessoryId = makeAccessoryId(node.id, endpointNumber)
  const scenesClient = endpoint.maybeStateOf(ScenesManagementClient)
  if (!scenesClient) return []

  const commands = endpoint.commandsOf(ScenesManagementClient)
  const groups = new Set<number>([0])
  const sceneInfo = scenesClient.fabricSceneInfo
  if (Array.isArray(sceneInfo)) {
    for (const info of sceneInfo) {
      if (typeof info.currentGroup === 'number') groups.add(info.currentGroup)
    }
  }

  const scenes: Scene[] = []
  for (const groupId of groups) {
    try {
      const membership = await commands.getSceneMembership({ groupId })
      const sceneList = membership?.sceneList
      if (!Array.isArray(sceneList)) continue
      for (const sceneId of sceneList) {
        let sceneName = `Scene ${sceneId}`
        try {
          const viewed = await commands.viewScene({ groupId, sceneId })
          if (typeof viewed?.sceneName === 'string' && viewed.sceneName.trim()) {
            sceneName = viewed.sceneName.trim()
          }
        } catch {
          void 0
        }
        scenes.push({
          id: `${accessoryId}:${groupId}:${sceneId}`,
          name: sceneName,
          isAvailable: true,
          accessoryId,
          groupId,
          sceneId,
        })
      }
    } catch {
      void 0
    }
  }

  return scenes
}

class MatterControllerService implements IMatterController {
  private serverNode: ServerNode | undefined
  private listeners: ((device: Accessory) => void)[] = []
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

  private createDebouncedRefresh(accessoryId: string): () => void {
    return () => {
      const existing = this.debounceTimers.get(accessoryId)
      if (existing) clearTimeout(existing)
      this.debounceTimers.set(accessoryId, setTimeout(() => {
        this.debounceTimers.delete(accessoryId)
        this.getDeviceState(accessoryId).then(accessory => {
          if (accessory) this.emitUpdate(accessory)
        }).catch(() => void 0)
      }, 100))
    }
  }

  private subscribeToEndpoint(node: ClientNode, endpoint: Endpoint): void {
    const accessoryId = makeAccessoryId(node.id, Number(endpoint.number))
    const refresh = this.createDebouncedRefresh(accessoryId)

    try {
      const onOffEvents = endpoint.eventsOf(OnOffClient) as { onOff$Changed?: { on: (cb: () => void) => void } }
      onOffEvents.onOff$Changed?.on(refresh)
    } catch { void 0 }

    if (endpoint.maybeStateOf(BridgedDeviceBasicInformationClient) !== undefined) {
      try {
        const bEvents = endpoint.eventsOf(BridgedDeviceBasicInformationClient) as { reachable$Changed?: { on: (cb: () => void) => void } }
        bEvents.reachable$Changed?.on(refresh)
      } catch { void 0 }
    }

    const deviceType = endpointDeviceType(endpoint)
    const handler = DeviceHandlerRegistry.get(deviceType)
    handler.subscribe(node, endpoint, refresh)
  }

  private subscribeToNode(node: ClientNode): void {
    if (!this.isCommissioned(node)) return
    const endpoints = controllableEndpoints(node)
    for (const endpoint of endpoints) {
      this.subscribeToEndpoint(node, endpoint)
    }
  }

  async start(): Promise<void> {
    this.serverNode = await ServerNode.create(ControllerRoot, {
      number: 0,
      controller: {
        adminFabricLabel: 'Home',
        ip: true,
        ble: false,
      },
      basicInformation: {
        vendorName: 'Home App',
        productName: 'Matter Controller',
        vendorId: VendorId(0xFFF1),
        productId: 1,
      },
    })
    await this.serverNode!.start()
    for (const node of this.serverNode!.peers) {
      this.subscribeToNode(node)
    }
  }

  onUpdate(listener: (device: Accessory) => void): void {
    this.listeners.push(listener)
  }

  private async findNodeById(deviceId: string): Promise<ClientNode | undefined> {
    if (!this.serverNode) return undefined
    for (const node of this.serverNode.peers) {
      if (node.id === deviceId) return node
    }
    return undefined
  }

  private async findNodeForAccessoryId(deviceId: string): Promise<{ node: ClientNode; endpointNumber?: number } | undefined> {
    const parsed = parseAccessoryId(deviceId)
    const node = await this.findNodeById(parsed?.nodeId ?? deviceId)
    if (!node) return undefined
    return { node, endpointNumber: parsed?.endpointNumber }
  }

  private isCommissioned(node: ClientNode): boolean {
    return node.maybeStateOf(CommissioningClient)?.peerAddress !== undefined
  }

  private async emitUpdate(accessory: Accessory): Promise<void> {
    for (const listener of this.listeners) {
      listener(accessory)
    }
  }

  async getDevices(): Promise<Accessory[]> {
    if (!this.serverNode) return []
    const devices: Accessory[] = []
    for (const node of this.serverNode.peers) {
      if (this.isCommissioned(node)) {
        devices.push(...await nodeToAccessories(node))
      }
    }
    return devices
  }

  async pairDevice(pairingCode: string): Promise<Accessory> {
    if (!this.serverNode) throw new Error('Controller not started')

    const clientNode: ClientNode = await this.serverNode.peers.commission({
      pairingCode,
      timeout: Seconds(60),
    })

    for (const endpoint of controllableEndpoints(clientNode)) {
      persistRoomFromEndpoint(makeAccessoryId(clientNode.id, Number(endpoint.number)), endpoint)
    }

    const accessories = await nodeToAccessories(clientNode)
    const accessory = accessories[0]
    if (!accessory) throw new Error('Paired device has no controllable endpoints')
    this.subscribeToNode(clientNode)
    this.emitUpdate(accessory)
    return accessory
  }

  async toggleDevice(deviceId: string): Promise<boolean> {
    const target = await this.findNodeForAccessoryId(deviceId)
    if (!target) throw new Error(`Device ${deviceId} not found`)
    const onOff = new OnOffControl(target.node)
    return onOff.toggle(target.endpointNumber)
  }

  async setDeviceOn(deviceId: string, on: boolean): Promise<boolean> {
    const target = await this.findNodeForAccessoryId(deviceId)
    if (!target) throw new Error(`Device ${deviceId} not found`)
    const onOff = new OnOffControl(target.node)
    return onOff.set(on, target.endpointNumber)
  }

  async discoverCommissionableDevices(): Promise<DiscoveredDevice[]> {
    if (!this.serverNode) return []
    try {
      const environment = this.serverNode.env
      const scanners = environment.get(ScannerSet)
      const udpScanner = scanners.scannerFor(0)
      if (!udpScanner) return []
      const devices = await udpScanner.findCommissionableDevices({}, Seconds(10))
      return devices.map((d: CommissionableDevice) => ({
        id: d.deviceIdentifier,
        name: d.DN || `Matter device`,
        vendor: d.VP ? String(d.VP) : undefined,
        discriminator: d.D ?? 0,
        address: d.addresses[0]?.ip ?? '',
        port: d.addresses[0]?.port ?? 5540,
      }))
    } catch {
      return []
    }
  }

  async setDeviceBrightness(deviceId: string, level: number): Promise<void> {
    const target = await this.findNodeForAccessoryId(deviceId)
    if (!target) throw new Error(`Device ${deviceId} not found`)
    const levelControl = new LevelControl(target.node)
    await levelControl.setLevel(level, target.endpointNumber)
  }

  async setDeviceColor(deviceId: string, color: { hue: number; saturation: number }): Promise<void> {
    const target = await this.findNodeForAccessoryId(deviceId)
    if (!target) throw new Error(`Device ${deviceId} not found`)
    const colorControl = new ColorControl(target.node)
    await colorControl.setColor(color, target.endpointNumber)
  }

  async pairDiscoveredDevice(identifier: Record<string, unknown>, passcode: number): Promise<Accessory> {
    if (!this.serverNode) throw new Error('Controller not started')
    const clientNode = await this.serverNode.peers.commission({
      passcode,
      discovery: { identifierData: identifier },
      timeout: Seconds(60),
    })

    for (const endpoint of controllableEndpoints(clientNode)) {
      persistRoomFromEndpoint(makeAccessoryId(clientNode.id, Number(endpoint.number)), endpoint)
    }

    const accessories = await nodeToAccessories(clientNode)
    const accessory = accessories[0]
    if (!accessory) throw new Error('Paired device has no controllable endpoints')
    this.subscribeToNode(clientNode)
    this.emitUpdate(accessory)
    return accessory
  }

  async identifyDevice(deviceId: string): Promise<void> {
    const target = await this.findNodeForAccessoryId(deviceId)
    if (!target) throw new Error(`Device ${deviceId} not found`)

    try {
      const endpoint = target.node.endpoints[target.endpointNumber ?? 0]
      if (!endpoint) throw new Error(`Endpoint not found for device ${deviceId}`)

      const commands = endpoint.commandsOf(IdentifyClient)
      if (commands) {
        await commands.identify({ identifyTime: 10 })
      }
    } catch (error) {
      console.error(`Failed to identify device ${deviceId}:`, error)
      throw error
    }
  }

  async setDeviceName(deviceId: string, name: string): Promise<void> {
    storageService.setCustomName(deviceId, name)
  }

  async setDeviceRoom(deviceId: string, roomId: string): Promise<void> {
    storageService.setRoomAssignment(deviceId, roomId)
  }

  async getDeviceState(deviceId: string): Promise<Accessory | null> {
    const target = await this.findNodeForAccessoryId(deviceId)
    if (!target) return null
    const accessories = await nodeToAccessories(target.node)
    return accessories.find(accessory => accessory.id === deviceId) ?? accessories[0] ?? null
  }

  async getBridges(): Promise<BridgeInfo[]> {
    if (!this.serverNode) return []
    const bridges: BridgeInfo[] = []
    for (const node of this.serverNode.peers) {
      if (!this.isCommissioned(node)) continue
      const accessories = await nodeToAccessories(node)
      const hasBridgedEndpoint = accessories.some(accessory => accessory.bridgeId === node.id)
      if (accessories.length > 1 || hasBridgedEndpoint) {
        bridges.push({
          id: node.id,
          name: getNodeFriendlyName(node),
          accessoryCount: accessories.length,
          isReachable: node.maybeStateOf(CommissioningClient)?.peerAddress !== undefined,
        })
      }
    }
    return bridges
  }

  async removeBridge(bridgeId: string): Promise<void> {
    const node = await this.findNodeById(bridgeId)
    if (!node) throw new Error(`Bridge ${bridgeId} not found`)
    try {
      await node.decommission()
    } catch {
      await node.delete()
    }
    storageService.removeAccessoryDataByNodeId(bridgeId)
  }

  async getScenes(): Promise<Scene[]> {
    if (!this.serverNode) return []
    const scenes: Scene[] = []
    for (const node of this.serverNode.peers) {
      if (!this.isCommissioned(node)) continue
      for (const endpoint of node.endpoints) {
        scenes.push(...await endpointScenes(node, endpoint))
      }
    }
    return scenes
  }

  async activateScene(sceneId: string): Promise<void> {
    const sceneSeparator = sceneId.lastIndexOf(':')
    const groupSeparator = sceneId.lastIndexOf(':', sceneSeparator - 1)
    const accessoryId = groupSeparator > 0 ? sceneId.slice(0, groupSeparator) : ''
    const groupIdText = groupSeparator > 0 ? sceneId.slice(groupSeparator + 1, sceneSeparator) : ''
    const sceneIdText = sceneSeparator > 0 ? sceneId.slice(sceneSeparator + 1) : ''
    const parsed = parseAccessoryId(accessoryId)
    const groupId = Number(groupIdText)
    const sceneNumber = Number(sceneIdText)
    if (!parsed || !Number.isInteger(groupId) || !Number.isInteger(sceneNumber)) {
      throw new Error(`Invalid scene ${sceneId}`)
    }

    const node = await this.findNodeById(parsed.nodeId)
    const endpoint = node?.endpoints.find(ep => Number(ep.number) === parsed.endpointNumber)
    if (!node || !endpoint) throw new Error(`Scene endpoint ${accessoryId} not found`)

    await endpoint.commandsOf(ScenesManagementClient).recallScene({
      groupId,
      sceneId: sceneNumber,
      transitionTime: 0,
    })
  }
}

export function createController(): IMatterController {
  return new MatterControllerService()
}
