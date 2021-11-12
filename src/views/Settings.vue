<template>
	<ion-page>
		<Header is-custom-back is-settings title="Настройки" />
		<ion-content :fullscreen="true">
			<ion-header collapse="condense">
				<ion-toolbar>
					<ion-title size="large">Профиль</ion-title>
				</ion-toolbar>
			</ion-header>
			<ion-list>
				<ion-card>
					<ion-item lines="none">
						<ion-icon slot="start" :icon="moon"></ion-icon>
						<ion-label>Темная тема</ion-label>
						<ion-toggle v-model="isDarkRef" color="light" id="themeToggle" @ionChange="onChangeTheme" slot="end"></ion-toggle>
					</ion-item>
				</ion-card>
				<ion-card class="custom-card">
					<ion-item lines="none">
						<ion-icon color="success" :icon="cameraOutline" slot="start"></ion-icon>
						<ion-select :value="currentTrack" v-bind:interface-options="interfaceOptions" ok-text="Сохранить" cancel-text="Отмена">
							<ion-select-option value="-1">Не выбрано</ion-select-option>
							<ion-select-option v-for="(camera, index) in videoTracks" v-bind:key="index" :value="index">{{ camera.label }}</ion-select-option>
						</ion-select>
					</ion-item>
				</ion-card>
			</ion-list>
		</ion-content>
	</ion-page>
</template>

<script lang="ts">
	import {
		IonIcon,
		IonPage,
		IonList,
		IonCard,
		IonItem,
		IonLabel,
		IonTitle,
		IonToggle,
		IonSelect,
		IonHeader,
		IonToolbar,
		IonContent,
		IonSelectOption
	} from '@ionic/vue';
	import Header from '@/components/Header.vue';
	import { defineComponent, ref } from 'vue';
	import { moon, cameraOutline, checkmarkCircleOutline } from 'ionicons/icons';

	export default defineComponent({
		name: 'Settings',
		components: {
			Header,
			IonIcon,
			IonPage,
			IonList,
			IonCard,
			IonItem,
			IonLabel,
			IonTitle,
			IonToggle,
			IonSelect,
			IonHeader,
			IonToolbar,
			IonContent,
			IonSelectOption
		},
		setup() {
			
			const streamRef = ref<any>(null);
			const videoTracks = ref<any>([]);
			const currentTrack = ref<any>("-1");
			const isDarkRef = ref<boolean>(false);

			const interfaceOptions = {
				header: 'Веб-камера'
			};
			const theme = localStorage.getItem('theme') ?? 'light';

			isDarkRef.value = theme == 'dark';

			const onChangeTheme = (event: any) => {
				isDarkRef.value = event.detail.checked;

				localStorage.setItem('theme', isDarkRef.value ? 'dark' : 'light');

				document.body.classList.toggle('dark', isDarkRef.value);
			};

			(async() => {
				streamRef.value = await navigator.mediaDevices.getUserMedia({
					audio: true,
					video: true,
				});
				const stream = streamRef.value;

				if (stream != null) {
					videoTracks.value = stream.getVideoTracks();
				}
			})();
			
			
			return {
				moon,
				isDarkRef,
				videoTracks,
				currentTrack,
				cameraOutline,
				onChangeTheme,
				interfaceOptions,
				checkmarkCircleOutline,

			};
		}
	});
</script>
