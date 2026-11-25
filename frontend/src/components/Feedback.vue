<script setup>
defineProps({busy:Boolean,error:String,success:String});
</script>
<template><p v-if="busy" class="notice" role="status">Working…</p><p v-if="error" class="notice error" role="alert">{{error}}</p><p v-if="success" class="notice success" role="status">{{success}}</p></template>
