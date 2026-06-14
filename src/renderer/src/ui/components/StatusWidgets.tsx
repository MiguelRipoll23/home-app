import React from 'react'
import { Sun, Thermometer, Zap, Home } from 'lucide-react'
import { StatusWidget } from './StatusWidget'
import './StatusWidgets.css'

export const StatusWidgets: React.FC = () => (
  <div className="status-widgets">
    <StatusWidget icon={<Sun size={24} />} label="Living Temp" value="22" unit="°C" />
    <StatusWidget icon={<Thermometer size={24} />} label="Outdoor Temp" value="15" unit="°C" />
    <StatusWidget icon={<Zap size={24} />} label="Power" value="150" unit="W" />
    <StatusWidget icon={<Home size={24} />} label="Humidity" value="45" unit="%" />
  </div>
)
