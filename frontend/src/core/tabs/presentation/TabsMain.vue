<template>
  <q-drawer
    v-model="drawer"
    side="left"
    bordered
    :width="$q.platform.is.desktop ? 170 : 120"
    :breakpoint="600"
  >
    <q-scroll-area
      style="
        height: calc(100% - 33px);
        margin-top: 33px;
        border-right: 1px solid #ddd;
      "
    >
      <q-list padding>
        <q-tabs v-model="tab" vertical class="text-teal">
          <q-space style="height: 250px"></q-space>
          <q-route-tab name="timers" icon="alarm" label="timers" to="/" />
        </q-tabs>
      </q-list>
    </q-scroll-area>

    <router-link to="/">
      <q-img
        class="absolute-top"
        src="https://img.yidoyoon.com/public/dummy-logo-black.svg"
        style="zoom: 11%; border-right: 1px solid #ddd"
        to="/"
        position="30px"
      />
    </router-link>
    <div style="height: 0" class="column justify-end q-pa-none q-ma-none">
      <q-btn
        icon="icon-ion-logo-github"
        size="1rem"
        flat
        dense
        href="https://github.com/yidoyoon"
        class="q-pa-none q-ma-none"
      />
    </div>
  </q-drawer>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref } from 'vue';

const $q = useQuasar();

// const drawer = $q.screen.gt.sm ? ref(true) : ref(false);
const drawer = ref(true);
const tab = ref('timers');
</script>
