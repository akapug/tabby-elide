chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('sync', { periodInMinutes: 15 })
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'sync') return
  try {
    const { default: boot } = await import('../lib/boot')
    await boot({ headless: true })
  } catch (e) {
    console.warn('sync error', e)
  }
})

