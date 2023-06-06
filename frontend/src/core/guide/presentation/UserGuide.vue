<template>
  <q-markdown
    :src="guide"
    class="fontsize-8"
    style="padding: 5em 8em; min-width: 500px"
  />
</template>

<script setup lang="ts">
import { useRoutineStore } from 'src/core/routines/infra/store/routine.store';
import { onBeforeMount } from 'vue';

import guide from './guide.md';

const routineStore = useRoutineStore();

onBeforeMount(() => {
  routineStore.bottomDrawerHeight = 36;
});
</script>
