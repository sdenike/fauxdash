'use client'

import { useEffect, useState } from 'react'
import { Card } from './ui/card'
import {
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui/button'

interface WeatherData {
  location: string
  temperature: number
  condition: string
  icon: string
  humidity: number
  windSpeed: number
}

export function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [locations, setLocations] = useState<string[]>([])
  const [autoRotateSeconds, setAutoRotateSeconds] = useState(30)

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    if (enabled && locations.length > 0) {
      fetchWeather()
    }
    // fetchWeather is intentionally omitted - we only want to refetch when enabled or locations change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, locations])

  useEffect(() => {
    if (weatherData.length > 1 && autoRotateSeconds > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % weatherData.length)
      }, autoRotateSeconds * 1000)

      return () => clearInterval(interval)
    }
  }, [weatherData.length, autoRotateSeconds])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setEnabled(data.weatherEnabled || false)
      setLocations(data.weatherLocations?.split(',').map((l: string) => l.trim()) || [])
      setAutoRotateSeconds(data.weatherAutoRotate || 30)
    } catch (error) {
      console.error('Failed to fetch weather settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWeather = async () => {
    try {
      const promises = locations.map(location =>
        fetch(`/api/weather?location=${encodeURIComponent(location)}`)
          .then(res => res.json())
      )

      const results = await Promise.all(promises)
      setWeatherData(results.filter(r => !r.error))
    } catch (error) {
      console.error('Failed to fetch weather:', error)
    }
  }

  if (loading || !enabled || weatherData.length === 0) {
    return null
  }

  const current = weatherData[currentIndex]

  return (
    <Card className="h-full">
      <div className="px-6 py-4 h-full flex items-center">
        <div className="flex items-center justify-between w-full gap-3">
          {weatherData.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setCurrentIndex((prev) =>
                prev === 0 ? weatherData.length - 1 : prev - 1
              )}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          )}

          <div className="flex items-center gap-3 flex-1 min-w-0">
            {current.icon && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={current.icon}
                alt={current.condition}
                className="w-12 h-12 object-contain flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-foreground">
                {Math.round(current.temperature)}°
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {current.location}
              </div>
            </div>
            <div className="flex gap-3 text-xs flex-shrink-0">
              <div className="text-center">
                <div className="text-muted-foreground">Humidity</div>
                <div className="font-semibold text-foreground">{current.humidity}%</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Wind</div>
                <div className="font-semibold text-foreground">{Math.round(current.windSpeed)} mph</div>
              </div>
            </div>
          </div>

          {weatherData.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setCurrentIndex((prev) =>
                (prev + 1) % weatherData.length
              )}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
