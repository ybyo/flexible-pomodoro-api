<template>
  <q-scroll-area style="height: 20vh">
    <div class="row">
      <BuilderCore :routine="newRoutine" style="height: 30vh" />
    </div>
  </q-scroll-area>
</template>

<script setup lang="ts">
import { useBuilderStore } from 'src/core/builder/infra/store/builder.store';
import BuilderCore from 'src/core/builder/presentation/components/BuilderCore.vue';
import { computed } from 'vue';

const builderStore = useBuilderStore();

const newRoutine = computed(() => {
  return builderStore.routineInBuilder;
});
</script>
