<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import { nanoid } from 'nanoid'
import { DateTime } from 'luxon';

type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

type CalendarChangePeriodType = 'prev' | 'next'

type EventDateTime = {
  date: string | null
  time: string | null
}

type EventFormData = {
  id: string | null
  title: string
  startEventDateTime: EventDateTime
  endEventDateTime: EventDateTime
}

const pageTitle = useState('page-title')

const { events, addEvent, updateEvent } = useEventStore()

const calendarRef = ref<typeof FullCalendar | null>(null)

const calendarContainer = ref<HTMLElement | null>(null)

const isOpenEventModal = ref(false)
const isEditableModalMode = ref(false)

const eventFormData = reactive<EventFormData>({
  id: null,
  title: '',
  startEventDateTime: {
    date: null,
    time: null
  },
  endEventDateTime: {
    date: null,
    time: null
  }
})

const calendarOptions = reactive({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: '',
    center: '',
    right: ''
  },
  views: {
    dayGridMonth: { buttonText: 'Month' },
    timeGridWeek: { buttonText: 'Week' },
    timeGridDay: { buttonText: 'Day' }
  },
  eventTimeFormat: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    omitZeroMinute: false,
    meridiem: false,
    hour12: false
  },
  slotLabelFormat: {
    hour: 'numeric' as const,
    minute: '2-digit' as const,
    omitZeroMinute: false,
    meridiem: false,
    hour12: false
  },
  events: events as never[],
  editable: true,
  selectable: true,
  eventClick: (info: any) => {
    fillEventFormData(info)
    handleOpenCreateEventModal(true)
  },
  eventDrop: (info: any) => {
    fillEventFormData(info)
    isEditableModalMode.value = true
    handleSaveEventData()
  },
  datesSet: () => {
    if (calendarRef.value) {
      const currentTitle = getCalendarInstanceApi().view.title
      calendarTitle.value = currentTitle
    }
  },
})

const calendarTitle = ref<string>('--')

const isValidForm = computed(() => !!eventFormData.title && !!eventFormData.startEventDateTime.date)

const getCalendarInstanceApi = () => {
  return calendarRef.value?.getApi()
}

const changeView = (viewType: CalendarViewType) => {
  if (calendarRef.value) {
    getCalendarInstanceApi().changeView(viewType)
  }
}

const changePeriod = (periodType: CalendarChangePeriodType) => {
  if (calendarRef.value) {
    if (periodType === 'prev')
      getCalendarInstanceApi().prev()
    else
      getCalendarInstanceApi().next()
  }
}

const handleResize = () => {
  if (calendarRef.value) {
    getCalendarInstanceApi().updateSize()
  }
}

const handleOpenCreateEventModal = (isEditable: boolean = false) => {
  isEditableModalMode.value = isEditable
  isOpenEventModal.value = true
}

const handleCloseModal = () => {
  isOpenEventModal.value = false
  eventFormData.title = ''
  eventFormData.startEventDateTime.date = null
  eventFormData.startEventDateTime.time = null
  eventFormData.endEventDateTime.date = null
  eventFormData.endEventDateTime.time = null
}


const formatDateTimeForFullCalendar = (date: string | null, time?: string | null) => {
  if (date) {
    return `${date}${time ? 'T' + time : ''}`
  } else {
    return undefined
  }
}

const fillEventFormData = (info: any) => {
  const currentStartDateTime = DateTime.fromJSDate(info.event.start)
  const currentEndDateTime = info.event.end ? DateTime.fromJSDate(info.event.end) : null
  eventFormData.id = info.event.id
  eventFormData.title = info.event.title
  eventFormData.startEventDateTime.date = currentStartDateTime.toISODate()
  const startTime = currentStartDateTime.toISOTime()?.substring(0, 5)
  eventFormData.startEventDateTime.time = (!currentEndDateTime && startTime != '00:00') ? (startTime || null) : null
  if (currentEndDateTime) {
    eventFormData.endEventDateTime.date = currentEndDateTime.toISODate()
    eventFormData.endEventDateTime.time = currentEndDateTime?.toISOTime()?.substring(0, 5) || null;
  } else {
    eventFormData.endEventDateTime.date = null
    eventFormData.endEventDateTime.time = null
  }
}

const handleSaveEventData = () => {
  const eventData = {
    id: isEditableModalMode.value ? eventFormData.id : nanoid(),
    title: eventFormData.title,
    start: formatDateTimeForFullCalendar(eventFormData.startEventDateTime.date, eventFormData.startEventDateTime.time) || null,
    end: formatDateTimeForFullCalendar(eventFormData.endEventDateTime.date, eventFormData.endEventDateTime.time) || null,
  }
  if (isEditableModalMode.value) {
    updateEvent(eventData)
  } else {
    addEvent(eventData)
  }

  handleCloseModal()
}

watch(calendarContainer, () => {
  if (calendarContainer.value) {
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(calendarContainer.value);
  }
});

onMounted(() => {
  pageTitle.value = 'Calendar'
})
</script>

<template>
  <div>
    <VCard>
      <div class="calendar" v-show="calendarRef">
        <div class="calendar__controls">
          <VButtons>
            <VButton color="dark" icon="lucide:plus" @click="handleOpenCreateEventModal()">
              Add event
            </VButton>
          </VButtons>
          <VButtons>
            <VButton color="dark" @click="changeView('dayGridMonth')">
              Month
            </VButton>
            <VButton color="dark" @click="changeView('timeGridWeek')">
              Week
            </VButton>
            <VButton color="dark" @click="changeView('timeGridDay')">
              Day
            </VButton>
          </VButtons>
        </div>
        <div class="calendar__header">
          <VButton color="dark" @click="changePeriod('prev')">
            <VIcon icon="lucide:chevron-left" />
          </VButton>
          <div class="calendar__header-title">
            <h1>{{ calendarTitle }}</h1>
          </div>
          <VButton color="dark" @click="changePeriod('next')">
            <VIcon icon="lucide:chevron-right" />
          </VButton>
        </div>
        <div class="calendar__element calendar-theme" ref="calendarContainer" @resize="handleResize">
          <FullCalendar ref="calendarRef" :options='calendarOptions' />
        </div>
      </div>
      <div v-if="!calendarRef">
        Loading...
      </div>
    </VCard>
    <VModal :title="isEditableModalMode ? 'Edit event' : 'Create event'" :open="isOpenEventModal"
      @close="handleCloseModal">
      <template v-slot:content>
        <VField>
          <VControl icon="lucide:captions">
            <VInput type="text" placeholder="Event title" autocomplete="event-title" v-model="eventFormData.title" />
          </VControl>
        </VField>
        <VField horizontal>
          <VControl icon="lucide:calendar" fullwidth>
            <VInput type="date" placeholder="Event start date" autocomplete="event-start-date"
              v-model="eventFormData.startEventDateTime.date" />
          </VControl>
          <VControl icon="lucide:clock-3" fullwidth>
            <VInput type="time" placeholder="Event start time" autocomplete="event-start-time"
              v-model="eventFormData.startEventDateTime.time" />
          </VControl>
        </VField>
        <VField horizontal>
          <VControl icon="lucide:calendar" fullwidth>
            <VInput type="date" placeholder="Event end date" autocomplete="event-end-date"
              v-model="eventFormData.endEventDateTime.date" />
          </VControl>
          <VControl icon="lucide:clock-3" fullwidth>
            <VInput type="time" placeholder="Event end time" autocomplete="event-end-time"
              v-model="eventFormData.endEventDateTime.time" />
          </VControl>
        </VField>
      </template>
      <template v-slot:action>
        <VButton :disabled="!isValidForm" color="primary" @click="handleSaveEventData">
          {{ isEditableModalMode ? 'Edit' : 'Create' }}
        </VButton>
      </template>
    </VModal>
  </div>
</template>

<style scoped lang="scss">
.calendar {
  .calendar__controls {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .calendar__header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .calendar__header-title {
      margin: 0 15px;
      font-size: 22px;
    }
  }
}

.calendar-theme {
  --fc-border-color: var(--dark-dark-text);
  --fc-event-bg-color: var(--primary);
  --fc-event-border-color: var(--primary);
  --fc-page-bg-color: var(--primary);

  ::v-deep(.fc-col-header-cell-cushion),
  ::v-deep(.fc-daygrid-day-number) {
    color: var(--primary)
  }

  ::v-deep(.fc-h-event),
  ::v-deep(.fc-v-event) {
    background-color: var(--primary);
  }

  ::v-deep(.fc .fc-scroller-liquid-absolute),
  ::v-deep(.fc .fc-view-harness-active > .fc-view) {
    position: relative;
  }

  ::v-deep(.fc .fc-view-harness-active) {
    height: auto !important;
  }

  ::v-deep(.fc-daygrid-day-events .fc-daygrid-day-bottom) {
    margin-bottom: 1px;
  }
}



@media screen and (max-width: 475px) {
  .calendar {
    .calendar__controls {
      flex-direction: column;
      margin-bottom: 1rem;
    }
  }
}
</style>
