<template>
	<ion-page>
		<Header is-custom-back is-settings title="Настройки" />
		<ion-content :fullscreen="true">
			<ion-header collapse="condense">
				<ion-toolbar>
					<ion-title size="large">Настройки</ion-title>
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
		IonHeader,
		IonToolbar,
		IonContent,
	} from '@ionic/vue';
	import Header from '@/components/Header.vue';
	import { defineComponent, ref } from 'vue';
	import { moon } from 'ionicons/icons';

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
			IonHeader,
			IonToolbar,
			IonContent,
		},
		setup() {
			const isDarkRef = ref(false);

			const theme = localStorage.getItem('theme') ?? 'light';

			isDarkRef.value = theme == 'dark';

			const onChangeTheme = (event: any) => {
				isDarkRef.value = event.detail.checked;

				localStorage.setItem('theme', isDarkRef.value ? 'dark' : 'light');

				document.body.classList.toggle('dark', isDarkRef.value);
			};

			return {
				moon,
				isDarkRef,
				onChangeTheme
			};
		}
	});
</script>
