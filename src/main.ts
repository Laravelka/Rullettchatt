import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import axios from 'axios';
import { IonicVue } from '@ionic/vue';
import { Device } from '@capacitor/device';
import {
	ActionPerformed,
	PushNotificationSchema,
	PushNotifications,
	Token,
} from '@capacitor/push-notifications';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Theme variables */
import './theme/variables.css';

const token = localStorage.getItem('token') ?? false;

axios.defaults.headers.common['SiteUrl'] = "http://localhost:5000/";

axios.defaults.baseURL = axios.defaults.headers.common['SiteUrl'] + 'api/';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

const app = createApp(App)
	.use(IonicVue)
	.use(router);

router.isReady().then(async() => {
	const info = await Device.getInfo();

	if (info.platform == 'android' || info.platform == 'ios') {
		PushNotifications.requestPermissions().then(result => {
			if (result.receive === 'granted') {
				// Register with Apple / Google to receive push via APNS/FCM
				PushNotifications.register();
			} else {
				// Show some error
			}
		});
	
		PushNotifications.addListener('registration', (token: Token) => {
			alert('Push registration success, token: ' + token.value);
		});
	
		PushNotifications.addListener('registrationError', (error: any) => {
			alert('Error on registration: ' + JSON.stringify(error));
		});

		PushNotifications.addListener(
			'pushNotificationReceived',
			(notification: PushNotificationSchema) => {
				alert('Push received: ' + JSON.stringify(notification));
			},
		);

		PushNotifications.addListener(
			'pushNotificationActionPerformed',
			(notification: ActionPerformed) => {
				alert('Push action performed: ' + JSON.stringify(notification));
			},
		);
	}
	axios.interceptors.response.use(function (response) {
		return response;
	}, function (error): Promise<never> {
		const { response } = error;

		if (response && response.statusText == 'Network Error') {
			router.replace({
				name: 'Error', 
				params: {
					code: response.statusText,
					message: 'Проверьте интернет соединение'
				}
			});
		} else if (response && response.status == 401) {
			localStorage.removeItem('user');
			localStorage.removeItem('token');

			router.replace({
				name: 'Error', 
				params: {
					code: response.status,
					message: response.statusText
				}
			});
		} else if (error.message == 'Network Error') {
			router.replace({
				name: 'Error', 
				params: {
					code: 'network error',
					message: 'Проверьте ваше интернет соединение'
				}
			});
		}
		return Promise.reject(error);
	});
	app.mount('#app');
});