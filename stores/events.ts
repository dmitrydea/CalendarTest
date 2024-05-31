import { defineStore } from 'pinia';
import { ref } from 'vue';

type Event = {
  id: string | null
  title: string
  start: string | null
  end: string | null
};

export const useEventStore = defineStore('events', () => {
  const events = ref<Event[]>([])

  const addEvent = (event: Event) => {
    events.value.push(event)
  }

  const updateEvent = (event: Event) => {
    const index = events.value.findIndex((e) => e.id === event.id)
    if (index !== -1) {
      events.value.splice(index, 1, event)
    }
  }

  return { events, addEvent, updateEvent }
});