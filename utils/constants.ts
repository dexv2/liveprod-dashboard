export const configs = {
  SESSION_MAX_AGE: process.env.SESSION_MAX_AGE || "12",
  SESSION_UPDATE_AGE: process.env.SESSION_UPDATE_AGE || "1",
  ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY
}

const role = {
  FOH: "foh",
  FOH_ASSISTANT: "foh assistant",
  FOH_TRAINEE: "foh trainee",
  FOH_ASSISTANT_TRAINEE: "foh assistant trainee",
  FOH_OBSERVER: "foh observer",
  MONITOR_MIX: "monitor mix",
  RF_TECH: "rf tech",
  MONITOR_MIX_TRAINEE: "monitor mix trainee",
  MONITOR_MIX_OBSERVER: "monitor mix observer",
  BROADCAST_MIX: "broadcast mix",
  BROADCAST_MIX_ASSISTANT: "broadcast mix assistant",
  BROADCAST_MIX_TRAINEE: "broadcast mix trainee",
  BROADCAST_MIX_ASSISTANT_TRAINEE: "broadcast mix assistant trainee",
  BROADCAST_MIX_OBSERVER: "broadcast mix observer",
  NXTGEN: "nxtgen",
  NXTGEN_TRAINEE: "nxtgen trainee",
  NXTGEN_OBSERVER: "nxtgen observer",
  AUDIO_CORE_TEAM: "audio core team",
  AUDIO_VOLUNTEER_1: "audio volunteer 1",
  AUDIO_VOLUNTEER_2: "audio volunteer 2",
}

export const serviceCode = {
  SNS_1: "sns1",
  // SNS_2: "sns2",
  SUNDAY_1: "sunday1",
  SUNDAY_2: "sunday2",
  SUNDAY_3: "sunday3",
  SUNDAY_4: "sunday4",
  IDC: "idc",
  B1G: "b1g",
  MMRC: "mmrc",
  SPECIAL_EVENT: "special event"
}

export const category: { [key: string]: string[] } = {
  SERVICES: [
    serviceCode.SNS_1,
    // serviceCode.SNS_2,
    serviceCode.SUNDAY_1,
    serviceCode.SUNDAY_2,
    serviceCode.SUNDAY_3,
    serviceCode.SUNDAY_4,
    serviceCode.IDC,
    serviceCode.B1G,
    serviceCode.MMRC,
    serviceCode.SPECIAL_EVENT,
  ],
  SATURDAY_SERVICES: [
    serviceCode.SNS_1,
    // serviceCode.SNS_2,
  ],
  SUNDAY_SERVICES: [
    serviceCode.SUNDAY_1,
    serviceCode.SUNDAY_2,
    serviceCode.SUNDAY_3,
    serviceCode.SUNDAY_4,
  ],
  REGULAR_SERVICES: [
    serviceCode.SNS_1,
    // serviceCode.SNS_2,
    serviceCode.SUNDAY_1,
    serviceCode.SUNDAY_2,
    serviceCode.SUNDAY_3,
    serviceCode.SUNDAY_4,
  ],
  ROLES: [
    role.FOH,
    role.FOH_ASSISTANT,
    role.FOH_TRAINEE,
    role.FOH_ASSISTANT_TRAINEE,
    role.FOH_OBSERVER,
    role.MONITOR_MIX,
    role.RF_TECH,
    role.MONITOR_MIX_TRAINEE,
    role.MONITOR_MIX_OBSERVER,
    role.BROADCAST_MIX,
    role.BROADCAST_MIX_ASSISTANT,
    role.BROADCAST_MIX_TRAINEE,
    role.BROADCAST_MIX_ASSISTANT_TRAINEE,
    role.BROADCAST_MIX_OBSERVER,
    role.NXTGEN,
    role.NXTGEN_TRAINEE,
    role.NXTGEN_OBSERVER,
    role.AUDIO_VOLUNTEER_1,
    role.AUDIO_VOLUNTEER_2,
  ],
  SNS_ROLES: [
    role.FOH,
    role.FOH_ASSISTANT,
    role.FOH_TRAINEE,
    role.FOH_ASSISTANT_TRAINEE,
    role.FOH_OBSERVER,
    role.MONITOR_MIX,
    role.MONITOR_MIX_TRAINEE,
    role.MONITOR_MIX_OBSERVER,
    role.BROADCAST_MIX,
    role.BROADCAST_MIX_ASSISTANT,
    role.BROADCAST_MIX_TRAINEE,
    role.BROADCAST_MIX_ASSISTANT_TRAINEE,
    role.BROADCAST_MIX_OBSERVER,
    role.AUDIO_VOLUNTEER_1,
    role.AUDIO_VOLUNTEER_2
  ],
  SNS_GSHEET_ROLES: [
    role.FOH,
    role.FOH_ASSISTANT,
    role.FOH_TRAINEE,
    role.FOH_ASSISTANT_TRAINEE,
    role.FOH_OBSERVER,
    role.MONITOR_MIX,
    role.RF_TECH,
    role.MONITOR_MIX_TRAINEE,
    role.MONITOR_MIX_OBSERVER,
    role.BROADCAST_MIX,
    role.BROADCAST_MIX_ASSISTANT,
    role.BROADCAST_MIX_TRAINEE,
    role.BROADCAST_MIX_ASSISTANT_TRAINEE,
    role.BROADCAST_MIX_OBSERVER,
    role.AUDIO_VOLUNTEER_1,
    role.AUDIO_VOLUNTEER_2
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
  ],
  UNAVAILABLE_STATUS: [
    "inactive",
    "on leave"
  ],
  GENDER: [
    "male",
    "female"
  ],
  CONFIRMATION: [
    "Yes",
    "No",
    "TBC"
  ]
}

export const saturday = {
  FIRST_SERVICE: "5PM",
}

export const sunday = {
  FIRST_SERVICE: "9am",
  SECOND_SERVICE: "12pm",
  THIRD_SERVICE: "3pm",
  FOURTH_SERVICE: "6pm"
}

export const serviceCodeToTime = {
  [serviceCode.SNS_1]: saturday.FIRST_SERVICE,
  [serviceCode.SUNDAY_1]: sunday.FIRST_SERVICE,
  [serviceCode.SUNDAY_2]: sunday.SECOND_SERVICE,
  [serviceCode.SUNDAY_3]: sunday.THIRD_SERVICE,
  [serviceCode.SUNDAY_4]: sunday.FOURTH_SERVICE
}

export const service = {
  SATURDAY: "saturday",
  SUNDAY: "sunday",
}

export const serviceTime = {
  [serviceCode.SNS_1]: "17:00",
  // [serviceCode.SNS_2]: "18:30",
  [serviceCode.SUNDAY_1]: "09:00",
  [serviceCode.SUNDAY_2]: "12:00",
  [serviceCode.SUNDAY_3]: "15:00",
  [serviceCode.SUNDAY_4]: "18:00"
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

export const roleFilter = [
  {
    label: "FOH",
    value: "foh",
    href: "/schedule/role/foh",
    roles: [
      role.FOH,
      role.FOH_ASSISTANT,
      role.FOH_TRAINEE,
      role.FOH_ASSISTANT_TRAINEE,
      role.FOH_OBSERVER
    ]
  },
  {
    label: "BC Mix",
    value: "bc-mix",
    href: "/schedule/role/bc-mix",
    roles: [
      role.BROADCAST_MIX,
      role.BROADCAST_MIX_ASSISTANT,
      role.BROADCAST_MIX_TRAINEE,
      role.BROADCAST_MIX_ASSISTANT_TRAINEE,
      role.BROADCAST_MIX_OBSERVER,
    ]
  },
  {
    label: "Mon Mix",
    value: "mon-mix",
    href: "/schedule/role/mon-mix",
    roles: [
      role.MONITOR_MIX,
      role.RF_TECH,
      role.MONITOR_MIX_TRAINEE,
      role.MONITOR_MIX_OBSERVER,
    ]
  },
  {
    label: "NXTGen",
    value: "nxtgen",
    href: "/schedule/role/nxtgen",
    roles: [
      role.NXTGEN,
      role.NXTGEN_TRAINEE,
      role.NXTGEN_OBSERVER,
    ]
  },
  {
    label: "Assistant",
    value: "assistant",
    href: "/schedule/role/assistant",
    roles: [
      role.FOH_ASSISTANT,
      role.BROADCAST_MIX_ASSISTANT
    ]
  },
  {
    label: "Trainee",
    value: "trainee",
    href: "/schedule/role/trainee",
    roles: [
      role.MONITOR_MIX_TRAINEE,
      role.BROADCAST_MIX_TRAINEE,
      role.BROADCAST_MIX_ASSISTANT_TRAINEE,
      role.NXTGEN_TRAINEE
    ]
  },
  {
    label: "Observer",
    value: "observer",
    href: "/schedule/role/observer",
    roles: [
      role.FOH_OBSERVER,
      role.MONITOR_MIX_OBSERVER,
      role.BROADCAST_MIX_OBSERVER,
      role.NXTGEN_OBSERVER
    ]
  },
  {
    label: "Volunteer",
    value: "volunteer",
    href: "/schedule/role/volunteer",
    roles: [
      role.AUDIO_VOLUNTEER_1,
      role.AUDIO_VOLUNTEER_2
    ]
  },
  {
    label: "Events",
    value: "events",
    href: "/schedule/role/events",
    roles: []
  },
  {
    label: "All",
    value: "all",
    href: "/schedule/role/all",
    roles: category.ROLES
  }
]

// ADMIN PERMISSIONS
export const ADD_VOLUNTEER = 'ADD_VOLUNTEER';
export const DELETE_VOLUNTEER_DATA = 'DELETE_VOLUNTEER_DATA';
export const ASSIGN_VOLUNTEER_SCHEDULE = 'ASSIGN_VOLUNTEER_SCHEDULE';
export const ADD_DATE_ROWS = 'ADD_DATE_ROWS';
export const UPDATE_VOLUNTEER_PROFILE = 'UPDATE_VOLUNTEER_PROFILE';
export const UPDATE_EVENT = 'UPDATE_EVENT';
export const UPDATE_TRAINING = 'UPDATE_TRAINING';
export const UPDATE_OBSERVER_TRACKER = 'UPDATE_OBSERVER_TRACKER';
export const UPDATE_ANNOUNCEMENTS = 'UPDATE_ANNOUNCEMENTS';
export const VIEW_VOLUNTEERS_LISTS = 'VIEW_VOLUNTEERS_LISTS';
export const VIEW_ASSIGNMENTS = 'VIEW_ASSIGNMENTS';
export const VIEW_TRAINING = 'VIEW_TRAINING';
export const VIEW_OBSERVER_TRACKER = 'VIEW_OBSERVER_TRACKER';
export const VIEW_ANALYTICS = 'VIEW_ANALYTICS';
export const VIEW_ANNOUNCEMENTS = 'VIEW_ANNOUNCEMENTS';
export const DELETE_EVENT = 'DELETE_EVENT';
export const DELETE_TRAINING = 'DELETE_TRAINING';
export const DELETE_OBSERVER_TRACKER = 'DELETE_OBSERVER_TRACKER';
export const DELETE_ANNOUNCEMENTS = 'DELETE_ANNOUNCEMENTS';
export const SHOW_GSHEET_BUTTON = 'SHOW_GSHEET_BUTTON';

export const PERMISSIONS = [
  { label: 'Add Volunteer', value: ADD_VOLUNTEER },
  { label: 'Delete Volunteer Data', value: DELETE_VOLUNTEER_DATA },
  { label: 'Assign Volunteer Schedule', value: ASSIGN_VOLUNTEER_SCHEDULE },
  { label: 'Add Date Rows', value: ADD_DATE_ROWS },
  { label: 'Update Volunteer Profile', value: UPDATE_VOLUNTEER_PROFILE },
  { label: 'Update Event', value: UPDATE_EVENT },
  { label: 'Update Training', value: UPDATE_TRAINING },
  { label: 'Update Observer Tracker', value: UPDATE_OBSERVER_TRACKER },
  { label: 'Update Announcements', value: UPDATE_ANNOUNCEMENTS },
  { label: 'View Volunteers Lists', value: VIEW_VOLUNTEERS_LISTS },
  { label: 'View Assignments', value: VIEW_ASSIGNMENTS },
  { label: 'View Training', value: VIEW_TRAINING },
  { label: 'View Observer Tracker', value: VIEW_OBSERVER_TRACKER },
  { label: 'View Analytics', value: VIEW_ANALYTICS },
  { label: 'View Announcements', value: VIEW_ANNOUNCEMENTS },
  { label: 'Delete Event', value: DELETE_EVENT },
  { label: 'Delete Training', value: DELETE_TRAINING },
  // { label: 'Delete Observer Tracker', value: DELETE_OBSERVER_TRACKER },
  // { label: 'Delete Announcements', value: DELETE_ANNOUNCEMENTS },
  { label: 'Show GSheet Update Button', value: SHOW_GSHEET_BUTTON }
];

export const VENUES = [
  'Main Hall',
  'MPH',
  '7F Gym',
  'GF Annex',
  '2F Annex',
  'Choir Room',
  'Social Hall',
  'BS Room',
  'Mezzanine',
  'Others'
];
