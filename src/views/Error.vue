<template>
	<ion-page>
		<ion-header v-if="false">
			<ion-toolbar>
				<ion-title>Ошибка</ion-title>
			</ion-toolbar>
		</ion-header>
		<ion-content :fullscreen="true">
			<ion-header collapse="condense" v-if="false">
				<ion-toolbar>
					<ion-title size="large">Ошибка</ion-title>
				</ion-toolbar>
			</ion-header>
			<ion-grid>
				<ion-row class="ion-text-center" style="height: 90vh">
					<ion-col>
						<h1><ion-text color="danger">Упс, {{ errorRef.code }}</ion-text></h1>
						<p class="text-muted">{{ errorRef.message }}</p>

						<ion-button v-if="enableButton !== 0" color="danger" href="/" style="margin-top: 10px">На главную</ion-button>
					</ion-col>
				</ion-row>
			</ion-grid>
		</ion-content>
	</ion-page>
</template>

<script lang="ts">
	import {
		IonGrid,
		IonRow,
		IonCol,
		IonText,
		IonPage,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonContent,
		IonButton,

	} from '@ionic/vue';
	import { defineComponent, ref } from 'vue';
    import { useRoute } from 'vue-router';

	export default defineComponent({
		name: 'Error',
		components: {
			IonGrid,
			IonRow,
			IonCol,
			IonText,
			IonPage,
			IonTitle,
			IonHeader,
			IonToolbar,
			IonContent,
			IonButton
		},
        setup() {
            const errorRef = ref<any>({
                code: 500,
                message: 'Application error',
				enableButton: 0
            });
            errorRef.value = useRoute().params;

            return {
                errorRef
            };
        }
	});
</script>

<style>
	ion-grid {
		height: calc(100vh - 200px);
	}
	ion-row {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}
</style>