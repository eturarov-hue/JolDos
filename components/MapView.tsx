'use client'

import { useEffect, useRef } from 'react'
import type { Master } from '@/types'
import type { Lang } from '@/lib/i18n'

export function MapView({
  coords,
  masters,
  activeMaster,
  onSelectMaster,
  onUseLocation,
  geoLoading,
  page = false,
  lang,
}: {
  coords: [number, number]
  masters: Master[]
  activeMaster: number
  onSelectMaster: (index: number) => void
  onUseLocation: () => void
  geoLoading: boolean
  page?: boolean
  lang: Lang
}) {
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    let tries = 0
    let retryTimer: number | undefined
    let frame1: number | undefined
    let frame2: number | undefined

    const destroyMap = () => {
      const current = mapRef.current
      mapRef.current = null
      if (current) {
        try { current.off() } catch {}
        try { current.remove() } catch {}
      }
      const container = mapEl.current as (HTMLDivElement & { _leaflet_id?: number }) | null
      if (container?._leaflet_id) delete container._leaflet_id
    }

    const init = () => {
      const L = (window as any).L
      const container = mapEl.current
      if (cancelled || !container) return
      if (!L) {
        if (tries++ < 40) retryTimer = window.setTimeout(init, 150)
        return
      }

      destroyMap()
      if (cancelled || !mapEl.current) return

      const map = L.map(mapEl.current, { zoomControl: false, attributionControl: true }).setView(coords, 14)
      mapRef.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map)

      const userIcon = L.divIcon({ className: 'joldos-marker-wrap', html: `<div class="joldos-user-marker">${lang==='kk'?'Сіз':lang==='en'?'You':'Вы'}</div>`, iconSize: [48, 48], iconAnchor: [24, 24] })
      L.marker(coords, { icon: userIcon }).addTo(map).bindPopup(lang==='kk'?'Сіздің орналасқан жеріңіз':lang==='en'?'Your location':'Ваше местоположение')

      masters.forEach((master, index) => {
        const icon = L.divIcon({ className: 'joldos-marker-wrap', html: `<button class="joldos-master-marker ${index === activeMaster ? 'selected' : ''}"><b>${master.eta.split(' ')[0]}</b><small>${lang==='en'?'min':'мин'}</small></button>`, iconSize: [52, 52], iconAnchor: [26, 26] })
        const marker = L.marker(master.coords, { icon }).addTo(map).bindPopup(`<b>${master.name}</b><br>${master.role}<br>${master.eta}`)
        marker.on('click', () => onSelectMaster(index))
      })

      const selectedMaster = masters[activeMaster]
      if (selectedMaster?.coords) {
        L.polyline([coords, selectedMaster.coords], { color: '#ffb800', weight: 6, opacity: 0.92 }).addTo(map)
      }

      frame1 = window.requestAnimationFrame(() => {
        frame2 = window.requestAnimationFrame(() => {
          if (cancelled || mapRef.current !== map || !mapEl.current?.isConnected) return
          try {
            map.invalidateSize({ animate: false })
            if (selectedMaster?.coords) {
              map.fitBounds(L.latLngBounds([coords, selectedMaster.coords]).pad(0.55), { animate: false })
            } else {
              map.setView(coords, 14, { animate: false })
            }
          } catch {}
        })
      })
    }

    init()
    return () => {
      cancelled = true
      if (retryTimer) window.clearTimeout(retryTimer)
      if (frame1) window.cancelAnimationFrame(frame1)
      if (frame2) window.cancelAnimationFrame(frame2)
      destroyMap()
    }
  }, [coords, masters, activeMaster, onSelectMaster, lang])

  return (
    <div className={`real-map ${page ? 'map-page' : ''}`}>
      <div ref={mapEl} className="leaflet-host" />
      {masters.length > 0 && <div className="map-label">{lang==='kk'?`${masters.length} шебер жақын жерде`:lang==='en'?`${masters.length} specialists nearby`:`${masters.length} мастера рядом`}</div>}
      <button type="button" className="locate" onClick={onUseLocation}>{geoLoading ? '…' : '◎'}</button>
    </div>
  )
}
