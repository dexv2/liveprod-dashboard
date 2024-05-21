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
    "lights",
    "camera",
    "audio",
    "graphics",
    "stage",
    "volunteer management"
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
