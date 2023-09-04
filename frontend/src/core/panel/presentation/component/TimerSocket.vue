<!--eslint-disable-next-line-->
<!--Intended empty template-->
<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useSocketStore } from 'stores/socket.store';
import { onMounted } from 'vue';

const $q = useQuasar();
const socketStore = useSocketStore();

onMounted(() => {
  socketStore.initSocket();
});
</script>
