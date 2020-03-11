const currentUTCHour = new Date().getUTCHours()
const now = new Date().getTime()
const nextMidnight = new Date()

exports.millisToMidnight = nextMidnight.setUTCHours(24,0,0,0) - now

const nextNoon = new Date()
if (currentUTCHour > 11) {
  nextNoon.setDate(new Date().getDate() + 1)
}
exports.millisToNoon = nextNoon.setUTCHours(12,0,0,0) - now

const next23pm = new Date()
if (currentUTCHour > 22) {
  nextNoon.setDate(new Date().getDate() + 1)
}
exports.millisTo23pm = nextNoon.setUTCHours(23,0,0,0) - now

const next22pm = new Date()
if (currentUTCHour > 21) {
  nextNoon.setDate(new Date().getDate() + 1)
}
exports.millisTo22pm = nextNoon.setUTCHours(22,0,0,0) - now
