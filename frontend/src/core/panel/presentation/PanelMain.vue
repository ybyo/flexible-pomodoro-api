<template>
  <q-space style="height: 1rem" />
  <div class="row wrap justify-center q-pt-sx">
    <div class="col-9 q-pt-lg">
      <PanelCore class="area" />
    </div>
    <div class="col-9 q-pt-md">
      <PanelQueue class="area" style="height: 15vh" />
    </div>
  </div>
</template>

<script setup lang="ts">
import PanelCore from 'src/core/panel/presentation/component/PanelCore.vue';
import PanelQueue from 'src/core/panel/presentation/component/PanelQueue.vue';
</script>

<style lang="scss" scoped>
.area {
  background-color: #f2f2f2;
  border-radius: 30px;
}

.q-dialog__inner > div {
  box-shadow: none;
  border: solid rgba(0, 0, 0, 0.12) 0.1px;
  // border:solid grey 0.01px;
}
</style>
