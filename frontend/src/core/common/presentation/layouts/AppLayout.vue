<template>
  <q-layout view="lHr lpR lFr">
    <!--    Right drawer button-->
    <!--    <q-page-sticky position="top-right" class="z-top">-->
    <!--      <q-btn @click="toggleRightDrawer" icon="menu" flat color="black" dense />-->
    <!--    </q-page-sticky>-->

    <!--    Invisible header-->
    <q-header>
      <ButtonHeader />
    </q-header>

    <q-page-container>
      <q-page>
        <router-view />
      </q-page>
    </q-page-container>

    <!--    TODO: 미니모드 적용-->
    <!--    TabsMain-->
    <TabsMain :TabsOpen="TabsOpen" />

    <!--    RightDrawer-->
    <RightDrawer :rightDrawerOpen="rightDrawerOpen" />

    <q-footer style="background-color: transparent">
      <BottomDrawer v-if="$q.platform.is.desktop" />
      <q-tabs v-else class="text-teal" v-model="tab" vertical>
        <q-route-tab name="timers" icon="alarm" label="timers" to="/" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useMeta, useQuasar } from 'quasar';
import BottomDrawer from 'src/core/common/presentation/components/BottomDrawer.vue';
import ButtonHeader from 'src/core/common/presentation/components/ButtonHeader.vue';
import TabsMain from 'src/core/tabs/presentation/TabsMain.vue';
import RightDrawer from 'src/core/timers/presentation/TimerMain.vue';
import { ref } from 'vue';

const $q = useQuasar();

const tab = ref('');
const rightDrawerOpen = $q.platform.is.desktop ? ref(true) : ref(false);
const TabsOpen = $q.platform.is.desktop ? ref(true) : ref(false);

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value;
};

// SEO
const metaData = {
  title: 'Pipe Timer',
  // titleTemplate: (title: string) => `${title} - My Website`,

  // meta tags
  meta: {
    description: {
      name: 'description',
      content:
        'Pipe timer is a flexible timer that allows for customizable time settings. You can use this timer to literally connect timers like pipes. It can be a great tool for any task that requires a repetition of consistent, regular work and rest periods, such as studying or exercising.',
    },
    keywords: {
      name: 'keywords',
      content:
        'Pipe Timer, Pomodoro, Timer, Watch, Routine, Online Timer, Compound, HIIT, Interval Timer, TABATA, Chaining',
    },
    equiv: {
      'http-equiv': 'Content-Type',
      content: 'text/html; charset=UTF-8',
    },
    ogTitle: {
      property: 'og:Pipe Timer',
      // template(ogTitle: string) {
      //   return `${ogTitle} - My Website`;
      // },
    },
  },

  // CSS tags
  link: {
    material: {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/icon?family=Material+Icons',
    },
  },

  // JS tags
  script: {
    ldJson: {
      type: 'application/ld+json',
      innerHTML: '{ "@context": "https://schema.org" }',
    },
  },

  // <html> attributes
  htmlAttr: {
    'xmlns:cc': 'https://creativecommons.org/ns#', // generates <html xmlns:cc="http://creativecommons.org/ns#">,
    empty: undefined, // generates <html empty>
  },

  // <body> attributes
  bodyAttr: {
    'action-scope': 'xyz', // generates <body action-scope="xyz">
    empty: undefined, // generates <body empty>
  },

  // <noscript> tags
  noscript: {
    default: 'This is content for browsers with no JS (or disabled JS)',
  },
};

useMeta(metaData);
</script>
