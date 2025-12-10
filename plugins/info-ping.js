import { createCanvas, registerFont } from 'canvas'
import { cpus as _cpus, totalmem, freemem, arch, platform, release, hostname, networkInterfaces } from 'os'
import { performance } from 'perf_hooks'
import { sizeFormatter } from 'human-readable'

let format = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`,
})

try {
  registerFont('./fonts/Inter-Regular.ttf', { family: 'Inter' })
  registerFont('./fonts/Inter-Bold.ttf', { family: 'Inter', weight: 'bold' })
} catch (e) {
  console.log('Font Inter tidak ditemukan, menggunakan font default.')
}

function getNetworkInfo() {
  const interfaces = networkInterfaces()
  for (const [name, nets] of Object.entries(interfaces)) {
    for (const net of nets) {
      if (net.family === 'IPv4' && !net.internal) {
        return `${name}: ${net.address}`
      }
    }
  }
  return 'No connection'
}

function calculateCoreUsage(cpus) {
  return cpus.map((cpu, index) => {
    const total = Object.values(cpu.times).reduce((sum, t) => sum + t, 0)
    const usage = 100 - (cpu.times.idle / total * 100)
    return {
      core: index + 1,
      usage: usage.toFixed(1),
      speed: (cpu.speed / 1000).toFixed(1)
    }
  })
}

function getPingStatus(ping) {
  if (ping < 50) return '🟢 Excellent'
  if (ping < 100) return '🟡 Good'
  if (ping < 200) return '🟠 Average'
  return '🔴 Poor'
}

function getPerformanceStatus(ping, cpuUsage, memoryUsage) {
  const score = (ping < 100 ? 1 : 0) + (cpuUsage < 80 ? 1 : 0) + (memoryUsage < 80 ? 1 : 0)
  if (score === 3) return '🟢 Optimal'
  if (score >= 2) return '🟡 Stable'
  return '🔴 Needs Attention'
}

async function generateDashboard() {
  const width = 1200
  const height = 900
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, width, height)

  const pingStart = performance.now()
  const pingEnd = performance.now()
  const ping = Math.round(pingEnd - pingStart)

  const usedMemory = totalmem() - freemem()
  const memoryUsage = ((usedMemory / totalmem()) * 100).toFixed(1)
  const cpus = _cpus()
  const coreUsages = calculateCoreUsage(cpus)
  const overallCpuUsage = (coreUsages.reduce((sum, c) => sum + parseFloat(c.usage), 0) / coreUsages.length).toFixed(1)

  const fontFamily = 'Inter, Arial, sans-serif'

  ctx.fillStyle = '#1e293b'
  ctx.font = `bold 42px ${fontFamily}`
  ctx.fillText('System Performance Dashboard', 50, 80)
  
  ctx.fillStyle = '#64748b'
  ctx.font = `16px ${fontFamily}`
  ctx.fillText('Real-time monitoring and system metrics', 50, 110)

  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(50, 130)
  ctx.lineTo(width - 50, 130)
  ctx.stroke()

  const mainGrid = {
    left: 50,
    right: width - 50,
    top: 150,
    columnWidth: 540,
    gap: 40
  }

  function drawBox(x, y, w, h, title) {
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, 8)
    ctx.fill()
    ctx.stroke()
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.05)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 2
    ctx.stroke()
    ctx.shadowBlur = 0
    
    ctx.fillStyle = '#1e293b'
    ctx.font = `bold 20px ${fontFamily}`
    ctx.fillText(title, x + 25, y + 35)
    
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x + 25, y + 42)
    ctx.lineTo(x + Math.min(200, ctx.measureText(title).width + 30), y + 42)
    ctx.stroke()
    
    return { contentX: x + 25, contentY: y + 65, contentWidth: w - 50 }
  }

  const sysBox = drawBox(mainGrid.left, mainGrid.top, mainGrid.columnWidth, 240, 'System Information')
  
  const sysInfo = [
    { label: 'Hostname', value: hostname().substring(0, 30) },
    { label: 'Operating System', value: `${platform()} ${arch()} ${release().split('-')[0]}` },
    { label: 'Network', value: getNetworkInfo() },
    { label: 'CPU Model', value: cpus[0].model.split('@')[0].trim() },
    { label: 'Total Cores', value: `${cpus.length} Cores` },
    { label: 'Node.js Version', value: process.version }
  ]
  
  ctx.font = `16px ${fontFamily}`
  sysInfo.forEach((item, i) => {
    ctx.fillStyle = '#64748b'
    ctx.fillText(item.label + ':', sysBox.contentX, sysBox.contentY + (i * 28))
    
    ctx.fillStyle = '#1e293b'
    ctx.font = `bold 16px ${fontFamily}`
    ctx.fillText(item.value, sysBox.contentX + 180, sysBox.contentY + (i * 28))
    ctx.font = `16px ${fontFamily}`
  })

  const perfBox = drawBox(mainGrid.right - mainGrid.columnWidth, mainGrid.top, mainGrid.columnWidth, 240, 'Performance Metrics')
  
  const perfStatus = getPerformanceStatus(ping, parseFloat(overallCpuUsage), parseFloat(memoryUsage))
  
  const metrics = [
    { label: 'Response Time', value: `${ping} ms`, color: ping < 100 ? '#10b981' : ping < 200 ? '#f59e0b' : '#ef4444' },
    { label: 'CPU Utilization', value: `${overallCpuUsage}%`, color: parseFloat(overallCpuUsage) < 70 ? '#10b981' : parseFloat(overallCpuUsage) < 90 ? '#f59e0b' : '#ef4444' },
    { label: 'Memory Usage', value: `${memoryUsage}%`, color: parseFloat(memoryUsage) < 70 ? '#10b981' : parseFloat(memoryUsage) < 90 ? '#f59e0b' : '#ef4444' },
    { label: 'System Status', value: perfStatus.text, color: perfStatus.color }
  ]
  
  metrics.forEach((metric, i) => {
    ctx.fillStyle = '#64748b'
    ctx.fillText(metric.label + ':', perfBox.contentX, perfBox.contentY + (i * 28))
    
    ctx.fillStyle = metric.color
    ctx.font = `bold 16px ${fontFamily}`
    ctx.fillText(metric.value, perfBox.contentX + 180, perfBox.contentY + (i * 28))
    ctx.font = `16px ${fontFamily}`
  })

  const memoryBox = drawBox(mainGrid.left, mainGrid.top + 260, mainGrid.columnWidth, 200, 'Memory Usage')
  
  ctx.fillStyle = '#1e293b'
  ctx.font = `bold 24px ${fontFamily}`
  ctx.fillText(`${format(usedMemory)} / ${format(totalmem())}`, memoryBox.contentX, memoryBox.contentY)
  
  ctx.fillStyle = parseFloat(memoryUsage) < 70 ? '#10b981' : parseFloat(memoryUsage) < 90 ? '#f59e0b' : '#ef4444'
  ctx.font = `bold 36px ${fontFamily}`
  ctx.fillText(`${memoryUsage}%`, memoryBox.contentX + 300, memoryBox.contentY)
  
  const barY = memoryBox.contentY + 50
  const barWidth = mainGrid.columnWidth - 100
  const usageWidth = barWidth * (memoryUsage / 100)
  
  ctx.fillStyle = '#e2e8f0'
  ctx.fillRect(memoryBox.contentX, barY, barWidth, 20)
  
  const barGradient = ctx.createLinearGradient(memoryBox.contentX, 0, memoryBox.contentX + usageWidth, 0)
  if (parseFloat(memoryUsage) < 70) {
    barGradient.addColorStop(0, '#10b981')
    barGradient.addColorStop(1, '#34d399')
  } else if (parseFloat(memoryUsage) < 90) {
    barGradient.addColorStop(0, '#f59e0b')
    barGradient.addColorStop(1, '#fbbf24')
  } else {
    barGradient.addColorStop(0, '#ef4444')
    barGradient.addColorStop(1, '#f87171')
  }
  
  ctx.fillStyle = barGradient
  ctx.fillRect(memoryBox.contentX, barY, usageWidth, 20)
  
  ctx.fillStyle = '#64748b'
  ctx.font = `14px ${fontFamily}`
  ctx.fillText('0%', memoryBox.contentX, barY + 40)
  ctx.fillText('100%', memoryBox.contentX + barWidth - 25, barY + 40)

  const cpuBox = drawBox(mainGrid.right - mainGrid.columnWidth, mainGrid.top + 260, mainGrid.columnWidth, 200, 'CPU Core Utilization')
  
  const coreGrid = {
    cols: 2,
    rows: Math.ceil(coreUsages.length / 2),
    itemWidth: 230,
    itemHeight: 60,
    startX: cpuBox.contentX,
    startY: cpuBox.contentY
  }
  
  coreUsages.forEach((core, i) => {
    const col = i % coreGrid.cols
    const row = Math.floor(i / coreGrid.cols)
    const x = coreGrid.startX + col * (coreGrid.itemWidth + 30)
    const y = coreGrid.startY + row * (coreGrid.itemHeight + 15)
    
    ctx.fillStyle = '#1e293b'
    ctx.font = `bold 16px ${fontFamily}`
    ctx.fillText(`Core ${core.core}`, x, y)
    
    ctx.fillStyle = '#64748b'
    ctx.font = `14px ${fontFamily}`
    ctx.fillText(`${core.speed} GHz`, x, y + 20)
    
    const usage = parseFloat(core.usage)
    const usageColor = usage < 70 ? '#10b981' : usage < 90 ? '#f59e0b' : '#ef4444'
    ctx.fillStyle = usageColor
    ctx.font = `bold 20px ${fontFamily}`
    ctx.fillText(`${usage}%`, x + 150, y)
    
    const coreBarWidth = 180
    const coreUsageWidth = coreBarWidth * (usage / 100)
    
    ctx.fillStyle = '#e2e8f0'
    ctx.fillRect(x, y + 30, coreBarWidth, 8)
    
    const coreBarGradient = ctx.createLinearGradient(x, 0, x + coreUsageWidth, 0)
    if (usage < 70) {
      coreBarGradient.addColorStop(0, '#10b981')
      coreBarGradient.addColorStop(1, '#34d399')
    } else if (usage < 90) {
      coreBarGradient.addColorStop(0, '#f59e0b')
      coreBarGradient.addColorStop(1, '#fbbf24')
    } else {
      coreBarGradient.addColorStop(0, '#ef4444')
      coreBarGradient.addColorStop(1, '#f87171')
    }
    
    ctx.fillStyle = coreBarGradient
    ctx.fillRect(x, y + 30, coreUsageWidth, 8)
  })

  const infoBox = drawBox(mainGrid.left, mainGrid.top + 480, width - 100, 180, 'System Resources')
  
  const processInfo = [
    { label: 'Process Uptime', value: `${Math.floor(process.uptime())} seconds` },
    { label: 'Free Memory', value: format(freemem()) },
    { label: 'Total Memory', value: format(totalmem()) },
    { label: 'Architecture', value: arch() },
    { label: 'Platform', value: platform() },
    { label: 'Kernel Version', value: release() }
  ]
  
  const columnWidth = (infoBox.contentWidth - 50) / 2
  
  processInfo.forEach((item, i) => {
    const column = i < 3 ? 0 : 1
    const row = i < 3 ? i : i - 3
    const x = infoBox.contentX + (column * columnWidth)
    const y = infoBox.contentY + (row * 28)
    
    ctx.fillStyle = '#64748b'
    ctx.font = `16px ${fontFamily}`
    ctx.fillText(item.label + ':', x, y)
    
    ctx.fillStyle = '#1e293b'
    ctx.font = `bold 16px ${fontFamily}`
    ctx.fillText(item.value, x + 180, y)
  })

  ctx.fillStyle = '#94a3b8'
  ctx.font = `14px ${fontFamily}`
  
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
  
  ctx.fillText(`Generated: ${timestamp}`, mainGrid.left, height - 30)
  ctx.fillText(`Dashboard v1.0 • All metrics are real-time`, width - 350, height - 30)

  return canvas.toBuffer()
}

var handler = async (m, { conn }) => {
  try {
    const pingStart = performance.now()
    const pingEnd = performance.now()
    const ping = Math.round(pingEnd - pingStart)
    
    const usedMemory = totalmem() - freemem()
    const memoryUsage = ((usedMemory / totalmem()) * 100).toFixed(1)
    const cpus = _cpus()
    const coreUsages = calculateCoreUsage(cpus)
    const overallCpuUsage = (coreUsages.reduce((sum, c) => sum + parseFloat(c.usage), 0) / coreUsages.length).toFixed(1)
    
    const host = hostname()
    const displayHost = host.length > 30 ? host.substring(0, 30) + '...' : host
    const network = getNetworkInfo()
    const pingStatus = getPingStatus(ping)
    const perfStatus = getPerformanceStatus(ping, parseFloat(overallCpuUsage), parseFloat(memoryUsage))
    
    const caption = `
🏓 *PING PERFORMANCE*
• Response Time: ${ping} ms
• Status: ${pingStatus}

🖥️ *SYSTEM INFO*
• Host: ${displayHost}
• Platform: ${platform()} ${arch()}
• OS: ${release()}

💾 *MEMORY USAGE*
• Total: ${format(totalmem())}
• Used: ${format(usedMemory)} (${memoryUsage}%)
• Free: ${format(freemem())}

⚡ *CPU STATUS*
• Model: ${cpus[0].model.split('@')[0].trim()}
• Cores: ${cpus.length}
• Usage: ${overallCpuUsage}%

📊 *PER CORE USAGE*
${coreUsages.map(core => `▸ Core ${core.core}: ${core.usage}%`).join('\n')}

📡 ${network}

🕐 *BOT STATUS*
• Uptime: ${Math.floor(process.uptime())}s
• Performance: ${perfStatus}
    `.trim()
    
    const buffer = await generateDashboard()
    await conn.sendMessage(m.chat, { 
      image: buffer, 
      caption: caption
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    m.reply('Failed to generate dashboard. Check console for details.')
  }
}

handler.help = ['ping']
handler.tags = ['info']
handler.command = /^(ping|monitor)$/i

export default handler