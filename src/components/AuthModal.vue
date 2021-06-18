<template>
	<div>
		<ion-button v-if="false" fill="clear" @click="dismissModal">
			<ion-icon size="large" :icon="closeOutline"></ion-icon>
		</ion-button>

		<ion-grid>
			<ion-row class="ion-justify-content-center ion-align-items-center centered-form">
				<ion-col size-xs="12" size-sm="9" size-md="8" size-xl="8">
					<ion-card>
						<ion-card-header>
							<ion-title>Регистрация</ion-title>
						</ion-card-header>
						<ion-card-content>
							<ion-item class="item-style-top custom" lines="none">
								<ion-label position="stacked">
									<h2>Имя</h2>
									<h3><p class="input-error"></p></h3>
								</ion-label>
								<ion-input class="custom" autocomplete="new-name" placeholder="Введите имя"></ion-input>

							</ion-item>
							<ion-item class="item-style-bottom custom" lines="none">
								<ion-label position="stacked">
									<h2>Пароль</h2>
									<h3><p class="input-error"></p></h3>
								</ion-label>
								<ion-input class="custom" autocomplete="new-password" placeholder="Введите пароль" type="password"></ion-input>

							</ion-item>
							<div class="form-button">
								<ion-button color="theme">
									Регистрация
								</ion-button>
							</div>
						</ion-card-content>
					</ion-card>
				</ion-col>
			</ion-row>
		</ion-grid>
	</div>
</template>

<script>
	import { 
		IonButton,
		IonLabel,
		IonInput,
		IonIcon,
		IonGrid,
		IonItem,
		// IonList,
		
		IonRow,
		IonCol,
		
	} from '@ionic/vue';

	import {
		closeOutline,
		logoFacebook,
		logoGoogle,
		logoVk,
		
	} from 'ionicons/icons';

	import { defineComponent } from 'vue';

	export default defineComponent({
		name: 'AuthModal',
		props: ['dataModal'],
		emits: ['closeModal'],
		components: {
			IonButton,
			IonLabel,
			IonInput,
			IonIcon,
			IonGrid,
			IonItem,
			// IonList,
			IonRow,
			IonCol,
		},
		setup(props, { emit }) {
			const dismissModal = () => emit('closeModal', true);

			return {
				dismissModal,
				closeOutline,
				logoFacebook,
				logoGoogle,
				logoVk,
			};
		}
	});
</script>

<style scoped>
	.social-buttons {
		display: flex;
	}

	ion-item.custom {
		--background: rgba(0, 0, 0, 0)!important;
	}

	ion-card {
		box-shadow: 0 12px 25px 0 rgb(0 0 0 / 45%);
	}
</style>