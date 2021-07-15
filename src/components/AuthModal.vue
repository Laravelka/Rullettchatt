<template>
	<div>
		<ion-grid>
			<ion-row class="ion-justify-content-center ion-align-items-center centered-form" style="height: 60vh;">
				<ion-col size-xs="12" size-sm="9" size-md="8" size-xl="8">
					<ion-card>
						<ion-card-header>
							<ion-segment v-model="currentSegment">
								<ion-segment-button value="auth">
									<ion-label>Вход</ion-label>
								</ion-segment-button>
								<ion-segment-button value="register">
									<ion-label>Регистрация</ion-label>
								</ion-segment-button>
							</ion-segment>
						</ion-card-header>
						<ion-card-content>
							<div v-if="errorMessage" class="error-message" v-text="errorMessage"></div>
							<ion-item class="item-style-top custom" lines="none">
								<ion-label position="stacked">
									<h2>Имя</h2>
									<h3><p class="input-error"></p></h3>
								</ion-label>
								<ion-input v-model="nameRef" class="custom" autocomplete="new-name" placeholder="Введите имя"></ion-input>

							</ion-item>
							<ion-item class="item-style-bottom custom" lines="none">
								<ion-label position="stacked">
									<h2>Пароль</h2>
									<h3><p class="input-error"></p></h3>
								</ion-label>
								<ion-input v-model="passwordRef" class="custom" autocomplete="new-password" placeholder="Введите пароль" type="password"></ion-input>

							</ion-item>
							<div class="form-button">
								<div v-if="currentSegment == 'auth'">
									<ion-button :disabled="isLoadButtonRef" @click="auth" color="theme">
										<template v-if="isLoadButtonRef">
											<ion-spinner name="dots"></ion-spinner>
										</template>
										<template v-else>
											Войти
										</template>
									</ion-button>
								</div>
								<div v-else>
									<ion-button :disabled="isLoadButtonRef" @click="register" color="theme">
										<template v-if="isLoadButtonRef">
											<ion-spinner name="dots"></ion-spinner>
										</template>
										<template v-else>
											Зарегистрироваться
										</template>
									</ion-button>
								</div>
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
		IonSegmentButton, 
		IonCardContent,
		IonCardHeader,
		// IonCardTitle,
		IonSegment,
		IonSpinner,
		IonButton,
		IonLabel,
		IonInput,
		// IonIcon,
		IonGrid,
		IonItem,
		// IonList,
		IonCard,

		IonRow,
		IonCol,
		
	} from '@ionic/vue';

	import {
		logoFacebook,
		logoGoogle,
		logoVk,
		
	} from 'ionicons/icons';

	import axios from 'axios';
	import { defineComponent, ref } from 'vue';

	export default defineComponent({
		name: 'AuthModal',
		props: ['dataModal'],
		emits: ['closeModal'],
		components: {
			IonSegmentButton, 
			IonCardContent,
			IonCardHeader,
			// IonCardTitle,
			IonSegment,
			IonSpinner,
			IonButton,
			IonLabel,
			IonInput,
			// IonIcon,
			IonGrid,
			IonItem,
			// IonList,
			IonCard,
			IonRow,
			IonCol,
		},
		setup(props, { emit }) {
			const nameRef = ref(null);
			const passwordRef = ref(null);
			const errorMessage = ref(null);
			const currentSegment = ref('auth');
			const isLoadButtonRef = ref(false);

			const auth = () => {
				isLoadButtonRef.value = true;

				axios.post('/auth', {
					name: nameRef.value, 
					password: passwordRef.value
				}).then((response) => {
					const { data } = response;
					const { user } = data;	

					isLoadButtonRef.value = false;

					if (user.token) {
						localStorage.setItem('token', user.token);
						localStorage.setItem('user', JSON.stringify(user));

						emit('closeModal', true);
					}
				}).catch((error) => {
					const { response } = error;

					if (response.data) {
						if (response.data.message) {
							errorMessage.value = response.data.message;

							setTimeout(() => {
								errorMessage.value = null;
							}, 3000);
						}
					} else {
						console.error(error);
					}
					isLoadButtonRef.value = false;
				});
			};

			const register = () => {
				isLoadButtonRef.value = true;

				axios.post('/register', {
					name: nameRef.value, 
					password: passwordRef.value
				}).then((response) => {
					const { data } = response;
					const { user } = data;

					isLoadButtonRef.value = false;

					if (user.token) {
						localStorage.setItem('token', user.token);
						localStorage.setItem('user', JSON.stringify(user));
						
						emit('closeModal', true);
					}
				}).catch((error) => {
					const { response } = error;

					if (response.data) {
						if (response.data.message) {
							errorMessage.value = response.data.message;

							setTimeout(() => {
								errorMessage.value = null;
							}, 3000);
						}
					} else {
						console.error(error);
					}
					isLoadButtonRef.value = false;
				});
			};

			return {
				isLoadButtonRef,
				currentSegment,
				errorMessage,
				logoFacebook,
				passwordRef,
				logoGoogle,
				register,
				nameRef,
				logoVk,
				auth,

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

	.error-message {
		padding: 0px 16px;
		text-align: center;
		color: var(--ion-color-danger);
	}
</style>