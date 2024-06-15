export const configs = {
  SESSION_MAX_AGE: process.env.SESSION_MAX_AGE || "12",
  SESSION_UPDATE_AGE: process.env.SESSION_UPDATE_AGE || "1",
  ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY
}

export const category = {
  SERVICES: [
    "sns",
    "9 am",
    "12 nn",
    "3 pm",
    "idc",
    "b1g",
    "mmrc",
    "special event"
  ],
  SATURDAY_SERVICE: "sns",
  SUNDAY_SERVICES: [
    "9 am",
    "12 nn",
    "3 pm",
  ],
  REGULAR_SERVICES: [
    "9 am",
    "12 nn",
    "3 pm",
    "sns",
  ],
  ROLES: [
    "foh",
    "foh assistant",
    "broadcast mix",
    "broadcast mix assistant",
    "broadcast mix trainee",
    "broadcast mix observer",
    "monitor mix",
    "monitor mix trainee",
    "monitor mix observer",
    "nxtgen",
    "nxtgen trainee",
    "nxtgen observer",
    "audio volunteer 1",
    "audio volunteer 2"
  ],
  SNS_ROLES: [
    "foh",
    "foh assistant",
    "broadcast mix",
    "broadcast mix assistant",
    "broadcast mix trainee",
    "broadcast mix observer",
    "audio volunteer 1",
    "audio volunteer 2"
  ],
  TIERS: [
    "independent",
    "observer",
    "trainee"
  ],
  SEGMENTS: [
    "audio",
    "lights",
    "camera",
    "graphics",
    "stage",
    "volunteer management"
  ],
  STATUS: [
    "observer",
    "trainee",
    "active",
    "inactive",
    "on leave"
  ]
};

export const common = {
  FIRST_SERVICE: "9 am",
  SECOND_SERVICE: "12 nn",
  THIRD_SERVICE: "3 pm"
}

export const serviceTime = {
  [category.SATURDAY_SERVICE]: "17:00",
  [common.FIRST_SERVICE]: "09:00",
  [common.SECOND_SERVICE]: "12:00",
  [common.THIRD_SERVICE]: "15:00"
}

export const color = {
  STATUS: {
    [category.STATUS[0]]: "text-blue-800",
    [category.STATUS[1]]: "text-yellow-800",
    [category.STATUS[2]]: "text-green-800",
    [category.STATUS[3]]: "text-red-800",
    [category.STATUS[4]]: "text-orange-800",
  }
}
