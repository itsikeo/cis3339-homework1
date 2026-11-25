<script setup>
defineProps({rows:Array,columns:Array,deletable:Boolean,busy:Boolean,empty:{type:String,default:'No records found.'}});defineEmits(['remove']);
</script>
<template><p v-if="!rows.length" class="empty">{{busy?'Loading records…':empty}}</p><div v-else class="table-wrap"><table><thead><tr><th v-for="col in columns" :key="col.key" scope="col">{{col.label}}</th><th v-if="deletable" scope="col">Action</th></tr></thead><tbody><tr v-for="record in rows" :key="record.id"><td v-for="col in columns" :key="col.key">{{record[col.key]}}</td><td v-if="deletable"><button class="danger" type="button" :disabled="busy" :aria-label="'Delete '+record.name" @click="$emit('remove',record)">Delete</button></td></tr></tbody></table></div></template>
