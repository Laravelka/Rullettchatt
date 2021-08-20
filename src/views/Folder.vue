<template>
	<ion-page>
		<Header :title="'Онлайн: ' + onlineRef"></Header>
		<ion-content :fullscreen="true">
			<ion-header collapse="condense">
				<ion-toolbar>
					<ion-title>Онлайн: {{ onlineRef }}</ion-title>
				</ion-toolbar>
			</ion-header>
			<ion-grid class="container-messages ion-hide-sm-up">
				<ion-row class="list-messages">
					<ion-col v-for="(message, index) in arrMessages" v-bind:key="index" :class="{lastMessageMobile: arrMessages.length == (index+1), firstMessageMobile: index == 0}" size="12" class="list-message remote">
						<span class="list-name">{{ (user.name != message.name ? message.name + ': ' : 'Я: ') }}</span><span class="list-text">{{ message.text }}</span>
					</ion-col>
				</ion-row>
			</ion-grid>
			<ion-grid>
				<ion-row>
					<ion-col size-lg="6" size-md="12" size-xs="12">
						<div class="d-flex ion-justify-content-center">
							<div class="video-container w-100">
								<video
									v-if="isCallRemote"
									id="remoteVideo"
									ref="remoteVideo"
									webkit-playsinline
									playsinline
									autoplay
									@play="onPlayStream($event)"
									class="video-block remote-mini"
								></video>
								<div v-else class="video-block remote-mini"></div>
							</div>
							<video
								muted
								id="localMiniVideo"
								ref="localMiniVideo"
								webkit-playsinline
								playsinline
								autoplay
								@play="onPlayStream($event)"
								class="video-block locale-mini"
							></video>
						</div>
						<div class="d-flex ion-justify-content-center mt-05">
							<ion-fab-button v-if="!isConnectRef" color="theme" @click="connect">
								<ion-icon :icon="powerOutline"></ion-icon>
							</ion-fab-button>
							<ion-fab-button v-else :disabled="!isConnectRef" color="danger" @click="disconnect">
								<ion-icon :icon="powerOutline"></ion-icon>
							</ion-fab-button>
							<ion-fab-button :disabled="!isConnectRef || remainingTime != 0 || !peerInstance" color="success" @click="next">
								<ion-icon :icon="arrowForwardOutline"></ion-icon>
							</ion-fab-button>
						</div>
					</ion-col>
					<ion-col size-lg="6" size-md="12" size-xs="12">
						<div class="d-flex ion-justify-content-center mt-2">
							<video
								muted
								id="localVideo"
								ref="localVideo"
								webkit-playsinline
								playsinline
								autoplay
								class="video-block locale"
								@play="onPlayStream($event)"
							></video>
						</div>
						<div class="d-flex ion-justify-content-center chat-messages ion-hide-sm-down">
							<ion-grid>
								<ion-row v-for="(message, index) in arrMessages" v-bind:key="index" :class="{lastMessage: arrMessages.length == (index+1), firstMessage: index == 0}">
									<ion-col v-if="message.name != user.name" size="9" class="message other">
										<span class="user_name">{{ message.name }}</span><br>
										<span>{{ message.text }}</span>
									</ion-col>
									<ion-col v-else-if="message.name == user.name" ref="(arrMessages.length == (index+1) ? lastMessage : null)" offset="3" size="9" class="message my">
										<span>{{ message.text }}</span>
									</ion-col>
								</ion-row>
							</ion-grid>
						</div>
						<div class="d-flex ion-justify-content-center fixed-on-mobile mt-05 chat-input">
							<ion-item class="chat-bg">
								<ion-icon v-if="false" color="theme" slot="start" class="icon-25" :icon="attachOutline"></ion-icon>
								
								<ion-input v-model="inputMessageRef"></ion-input>

								<ion-icon @click="sendMessage" color="theme" slot="end" class="icon-25" :icon="paperPlaneOutline"></ion-icon>
							</ion-item>
						</div>
						<ion-toast
							:color="toastColorRef"
							:is-open="isOpenToast"
							:message="toastMessageRef"
							:duration="3000"
							@didDismiss="isOpenToast = false"
						>
						</ion-toast>
					</ion-col>
				</ion-row>
			</ion-grid>
		</ion-content>
	</ion-page>
</template>

<script lang="ts">
	import { 
		IonFabButton,
		IonToast, 
		IonContent, 
		IonHeader, 
		IonPage, 
		IonTitle, 
		IonToolbar,
		// IonButton,
		IonInput,
		IonItem,
		IonGrid,
		IonIcon,
		IonCol,
		IonRow,

	} from '@ionic/vue';
	
	import {
		arrowForwardOutline,
		paperPlaneOutline,
		settingsOutline,
		attachOutline,
		powerOutline,
		// sendOutline,

	} from 'ionicons/icons';
	import { App } from '@capacitor/app';
	import { Device } from '@capacitor/device';
	import { defineComponent, ref } from 'vue';
	// import { InAppPurchase2 } from '@ionic-native/in-app-purchase-2';

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const SocketIoClient = require('socket.io-client');

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const WebRTCPeerClient = require('webrtc-peer-client');

	import Header from '@/components/Header.vue';
	import { useRouter } from 'vue-router';
	import axios from 'axios';

	export default defineComponent({
		name: 'Folder',
		components: {
			IonFabButton,
			IonContent,
			IonHeader,
			IonToast,
			IonPage,
			IonTitle,
			IonToolbar,
			// IonButton,
			IonInput,
			IonItem,
			IonGrid,
			IonIcon,
			Header,
			IonCol,
			IonRow
		},
		setup() {
			const router = useRouter();
			const getUser = localStorage.getItem('user');
			const token = localStorage.getItem('token'),
				isAuth = token !== null;

			let socket = SocketIoClient(axios.defaults.headers.common['SiteUrl'], {
				query: {
					token: token
				}
			});	

			const user = ref<any>({});

			if (getUser !== null) {
				user.value = JSON.parse(getUser);
			}
			
			const streamRef = ref<any>(null);

			const setStream = (value: any) => streamRef.value = value;

			const arrMessages = ref<any>([]);
			const peerInstance = ref<any>(null);

			const signal = ref<any>(null);
			const localVideo = ref<any>(null);
			const remoteVideo = ref<any>(null);
			const localMiniVideo = ref<any>(null);

			const lastMessage = ref<any>(null);
			const lastMessageMobile = ref<any>(null);

			const lastUserId = ref<any>(null);
			const remoteUserId = ref<any>(null);

			const onlineRef = ref(0);
			const isOpenToast = ref(false);
			const isConnectRef = ref(false);
			const isCallRemote = ref(false);
			const isStopReconnect = ref(false);

			const remainingTime = ref(0);
			const toastColorRef = ref<string>('primary');

			const nextButtonText = ref<string|null>(null);
			const inputMessageRef = ref<string|null>(null);
			const toastMessageRef = ref<string|null>(null);

			const onPlayStream = (event: any) => {
				event.target.style.backgroundImage = 'none';
			};

			const throttleButton = (time = 5) => {
				remainingTime.value = time;

				setInterval(() => {
					remainingTime.value = remainingTime.value - 1;
					nextButtonText.value = 'Подождите ' + remainingTime.value + ' сек...';

					if (remainingTime.value == 0) {
						nextButtonText.value = '';

						return;
					}
				}, time * 1000);
			};

			socket.on('updateOnline', (online: any) => {
				onlineRef.value = online.all;
			});

			socket.on('errorMessage', (message: any) => {
				if (message.type === 'auth_fail' && (getUser !== null || token !== null)) {
					isOpenToast.value = true;
					toastColorRef.value = 'danger';
					toastMessageRef.value = message.text;
				} else if (message.type !== 'auth_fail') {
					isOpenToast.value = true;
					toastColorRef.value = 'danger';
					toastMessageRef.value = message.text;
				}

				setTimeout(async() => {
					isOpenToast.value = false;
					toastColorRef.value = 'primary';
					toastMessageRef.value = null;

					const info = await Device.getInfo();

					if (message.type == 'two_window') {
						if (info.platform == 'android' || info.platform == 'ios') {
							App.exitApp();
						} else {
							router.replace({
								name: 'Error', 
								params: {
									code: 'ошибка',
									message: 'Перезайдите или попробуйте позже'
								}
							});
						}
					} else if (message.type == 'auth_fail') {
						if (getUser !== null || token !== null) {
							if (info.platform == 'android' || info.platform == 'ios') {
								App.exitApp();
							} else {
								router.replace({
									name: 'Error', 
									params: {
										code: 'ошибка',
										message: 'Ошибка аутентификации',
										enableButton: 1,
									}
								});
							}
							localStorage.removeItem('user');
							localStorage.removeItem('token');
						}
					}
				}, 3000);
			});

			const startStreaming = async() => {
				setStream(await navigator.mediaDevices.getUserMedia({
					audio: true,
					video: true,
				}));
				const stream = streamRef.value;
				const videoTracks = stream.getVideoTracks();
				const peerClient = new WebRTCPeerClient(socket, {
					stream: stream
				});

				if (videoTracks.length === 0) {
					isOpenToast.value = true;
					toastColorRef.value = 'danger';
					toastMessageRef.value = 'Включите камеру или предоставьте доступ к ней.';

					setTimeout(() => {
						isOpenToast.value = false;
						toastColorRef.value = 'primary';
						toastMessageRef.value = null;
					}, 4000);
				} else {
					console.log(videoTracks[0].label);

					if (localVideo.value && localMiniVideo.value) {
						if ('srcObject' in localVideo.value && 'srcObject' in localMiniVideo.value) {
							localVideo.value.srcObject = stream;
							localMiniVideo.value.srcObject = stream;
						} else if (localVideo.value.src && localMiniVideo.value.src) {
							localVideo.value.src = window.URL.createObjectURL(stream);
							localMiniVideo.value.src = window.URL.createObjectURL(stream);
						}
					}

					const getRandomId = (ids: any) => {
						ids = ids.filter((id: any) => { 
							return id != peerClient.id && id != lastUserId.value;
						});
						return ids[Math.floor(Math.random() * ids.length)];
					};

					const onPeer = (peer: any, localStream: any) => {
						peer.addStream(localStream);

						peer.on('stream', (remoteStream: any) => {
							if (remoteVideo.value) {
								if ('srcObject' in remoteVideo.value) {
									remoteVideo.value.srcObject = remoteStream;
								} else if (remoteVideo.value.src) {
									remoteVideo.value.src = window.URL.createObjectURL(remoteStream);
								}
							}
						});
					};
					
					peerClient.on('discover', async (allIDs: any) => {
						const id = getRandomId(allIDs);
						
						if (id !== undefined) {
							lastUserId.value   = id;
							arrMessages.value  = [];
							remoteUserId.value = id;
							isConnectRef.value = true;
							isCallRemote.value = true;
							
							const { peer } = await peerClient.connect(id);
							
							peer.on('error', (err: any) => {
								console.log('RTC Error:', err);
							})

							peer.on('data', (chunk: any) => {
								const decoder = new TextDecoder("utf-8");

								console.log('onDataDiscover: ', chunk, decoder.decode(chunk));
							});

							peerInstance.value = peer;

							onPeer(peer, stream);

							peer.on('close', () => {
								console.log('close discover peer');

								isConnectRef.value = false;
								isCallRemote.value = false;
								remoteUserId.value = null;
							});
						} else {
							isOpenToast.value = true;
							toastColorRef.value = 'theme';
							toastMessageRef.value = 'Ожидание пользователей...';

							setTimeout(() => {
								isOpenToast.value = false;
								toastColorRef.value = 'primary';
								toastMessageRef.value = null;
							}, 3000);
						}
					});

					peerClient.on('request', async (request: any) => {
						if (!remoteUserId.value) {
							const { peer } = await request.accept();

							peer.on('error', (err: any) => {
								console.log('RTC Request Error:', err);
							});

							peer.on('data', (chunk: any) => {
								const decoder = new TextDecoder("utf-8");

								console.log('onDataRequest: ', chunk, decoder.decode(chunk));
							});

							peerInstance.value = peer;

							peer.addStream(stream);

							arrMessages.value  = [];
							isConnectRef.value = true;
							isCallRemote.value = true;
							lastUserId.value   = request.initiator;
							remoteUserId.value = request.initiator;

							peer.on('stream', (remoteStream: any) => {
								if (remoteVideo.value) {
									if ('srcObject' in remoteVideo.value) {
										remoteVideo.value.srcObject = remoteStream;
									} else if (remoteVideo.value.src) {
										remoteVideo.value.src = window.URL.createObjectURL(remoteStream);
									}
								}

								peer.on('close', () => {
									console.log('close request peer');

									remoteUserId.value = null;
									isCallRemote.value = false;
									isConnectRef.value = false;
								});
							});
						} else {
							await request.reject();

							console.log('Отклонили звонок от(т.к уже заняты): ', request.initiator);
						}
					});

					peerClient.on('reject', async (data: any) => {
						console.log('reject:', data);

						isConnectRef.value = false;
						isCallRemote.value = false;
						remoteUserId.value = null;
					});

					peerClient.on('message', async (data: any) => {
						const { from, message } = data;

						console.log('message:', data);

						arrMessages.value.push({
							name: from.user.name,
							text: message
						});

						setTimeout(() => {
							const element = document.getElementsByClassName('lastMessage')[0];
							const elementMobile = document.getElementsByClassName('lastMessageMobile')[0];

							element.scrollIntoView({ behavior: 'smooth' });
							elementMobile.scrollIntoView({ behavior: 'smooth' });
						}, 200);
					});
				}

				return {
					peer: peerInstance,
					stream: stream,
					signal: peerClient,
				};
			};

			if (isAuth) {
				startStreaming().then((result) => {
					signal.value = result.signal;
					peerInstance.value = result.peer.value;

					socket.on('simple-signal[reject]', (data: any) => {
						console.log('Звонок отклонен, т.к нет доступных пользователей', data);

						isCallRemote.value = false;
						remoteUserId.value = null;

						isOpenToast.value = true;
						toastColorRef.value = 'danger';
						toastMessageRef.value = 'Нет доступных пользователей, переподключение...';

						setTimeout(() => {
							isOpenToast.value = false;
							toastColorRef.value = 'primary';
							toastMessageRef.value = null;

							if (!isStopReconnect.value) {
								signal.value.discover();
							}
						}, 5000);
					});
				});
			} else {
				socket.on('login', (data: any) => {
					user.value = data;
					
					console.log('login:', data);
					
					socket = SocketIoClient(axios.defaults.headers.common['SiteUrl'], {
						query: {
							token: data.token
						}
					});	

					startStreaming().then((result) => {
						signal.value = result.signal;
						peerInstance.value = result.peer.value;

						socket.on('simple-signal[reject]', (data: any) => {
							console.log('Звонок отклонен, т.к нет доступных пользователей', data);

							isCallRemote.value = false;
							remoteUserId.value = null;

							isOpenToast.value = true;
							toastColorRef.value = 'danger';
							toastMessageRef.value = 'Нет доступных пользователей, переподключение...';

							setTimeout(() => {
								isOpenToast.value = false;
								toastColorRef.value = 'primary';
								toastMessageRef.value = null;

								if (!isStopReconnect.value) {
									signal.value.discover();
								}
							}, 5000);
						});
					});
				});
			}

			const sendMessage = () => {
				if (remoteUserId.value !== null) {
					signal.value.sendMessage(remoteUserId.value, inputMessageRef.value);

					arrMessages.value.push({
						name: user.value.name,
						text: inputMessageRef.value
					});

					peerInstance.value.write(inputMessageRef.value);

					setTimeout(() => {
						const element = document.getElementsByClassName('lastMessage')[0];
						const elementMobile = document.getElementsByClassName('lastMessageMobile')[0];

						element.scrollIntoView({ behavior: 'smooth' });
						elementMobile.scrollIntoView({ behavior: 'smooth' });
					}, 200);
					inputMessageRef.value = null;
				}
			};

			const disconnect = () => {
				peerInstance.value.destroy();

				remoteUserId.value = null;
				isCallRemote.value = false;
				isConnectRef.value = false;
				isStopReconnect.value = true;
			};

			const connect = () => {
				signal.value.discover();

				isConnectRef.value = true;
			};

			const next = () => {
				throttleButton();

				peerInstance.value.destroy();
				signal.value.discover();

				remoteUserId.value = null;
				isCallRemote.value = false;
				isConnectRef.value = false;
			};

			return {
				arrowForwardOutline,
				paperPlaneOutline,
				lastMessageMobile,
				toastMessageRef,
				inputMessageRef,
				settingsOutline,
				nextButtonText,
				localMiniVideo,
				startStreaming,
				toastColorRef,
				remainingTime,
				attachOutline,
				isConnectRef,
				isCallRemote,
				peerInstance,
				onPlayStream,
				powerOutline,
				lastMessage,
				arrMessages,
				sendMessage,
				remoteVideo,
				// sendOutline,
				isOpenToast,
				localVideo,
				disconnect,
				lastUserId,
				onlineRef,
				connect,
				signal,
				user,
				next,

			};
		}
	});
</script>

<style scoped>
	video {
		width: 100%;
		display: block;
		object-fit: cover!important;
		left: 0;
		height: 100%;
		position: absolute;
		top: 0;
	}

	.is_overlay {
		display: block;
		width: 100%;
		height: 100%;
	}

	ion-item.chat-bg {
		--highlight-height: 0;
		--border-radius: .5rem;
	}

	.video-block {
		background-image: linear-gradient(#999, #555);
		height: calc(55vh - 80px);
		max-height: calc(60vh - 80px);
		border-radius: 0.5rem;
		position: relative;
		width: 100%;
	}

	.video-block.locale-mini {
		display: none;
	}

	@media (prefers-color-scheme: dark) {
		.chat-block {
			background: #1e1e1e;
			border-radius: .5rem;
			border: 1px solid #3a3a3a;
			margin: 0 30px;
		}

		ion-item.chat-bg {
			width: 100%;
			--min-height: 48px;
			--background: var(--ion-color-light-shade)/*rgb(104 125 187 / 85%)*/!important;
		}
	}

	.chat-messages {
		margin-top: .4rem;
		overflow-y: scroll;
		max-height: 203px;
		-ms-overflow-style: none;
	}

	@media (min-width: 320px) {
		.video-block {
			height: calc(60vh - 80px);
			max-height: calc(65vh - 80px);
		}

		.ios .video-block {
			max-height: 60vh;
		}

		.video-block.locale {
			display: none;
		}

		.video-block.locale-mini {
			display: inline-block;
			width: 130px!important;
			height: 130px!important;
			margin: 0;
			border-radius: 0.5rem 0 .5rem;
			position: absolute;
			top: 4px;
			left: 4px;
		}

		.fixed-on-mobile {
			position: fixed;
			bottom: 0;
			width: 100%;
			left: 0;
		}

		ion-item.chat-bg {
			width: 100%;
			--min-height: 48px;
			--background: var(--ion-color-light-shade)/*rgb(104 125 187 / 85%)*/!important;
			--border-radius: .5rem .5rem 0 0!important;
		}
	}

	@media (min-width: 360px) {
		.video-block {
			height: calc(65vh - 80px);
			max-height: calc(70vh - 80px);
		}

		.ios .video-block {
			max-height: 70vh;
		}

		.video-block.locale {
			display: none;
		}

		.video-block.locale-mini {
			display: inline-block;
			width: 130px!important;
			height: 130px!important;
			margin: 0;
			border-radius: 0.5rem 0 .5rem;
			position: absolute;
			top: 4px;
			left: 4px;
		}

		.fixed-on-mobile {
			position: fixed;
			bottom: 0;
			width: 100%;
			left: 0;
		}

		ion-item.chat-bg {
			width: 100%;
			--min-height: 48px;
			--background: var(--ion-color-light-shade)/*rgb(104 125 187 / 85%)*/!important;
			--border-radius: .5rem .5rem 0 0!important;
		}
	}

	@media (min-width: 575.98px) {
		.chat-messages {
			margin-top: 0;
			overflow-y: scroll;
			max-height: 245px;
		}

		.ios .chat-messages {
			margin-top: 0;
			overflow-y: scroll;
			max-height: 188px;
		}

		.chat-block {
			margin: 0 30px;
		}

		.video-block {
			height: calc(73vh - 80px);
			max-height: calc(80vh - 80px);
		}

		.ios .video-block {
			max-height: 70vh;
		}

		.video-block.locale {
			display: none;
		}

		.video-block.locale-mini {
			display: inline-block;
			width: 200px!important;
			height: 200px!important;
			margin: 0;
			border-radius: 0.5rem 0 .5rem;
			position: absolute;
			top: 4px;
			left: 4px;
		}

		.fixed-on-mobile {
			position: fixed;
			bottom: 0;
			width: 100%;
			left: 0;
		}

		ion-item.chat-bg {
			width: 100%;
			--min-height: 48px;
			--background: var(--ion-color-light-shade)/*rgb(104 125 187 / 85%)*/!important;
			--border-radius: .5rem .5rem 0 0!important;
		}

		.other > .time {
			color: #848484;
		}

		.my > .time {
			color: #ffffff78;
		}
	}

	@media (min-width: 768px) {
		.video-block {
			height: calc(75vh - 80px);
			max-height: calc(80vh - 80px);
		}

		.ios .video-block {
			max-height: 70vh;
		}

		.video-block.locale {
			display: none;
		}

		.video-block.locale-mini {
			display: inline-block;
			width: 240px!important;
			height: 240px!important;
			margin: 0;
			border-radius: 0.5rem 0 .5rem;
			position: absolute;
			top: 4px;
			left: 4px;
		}

		.fixed-on-mobile {
			position: fixed;
			bottom: 0;
			width: 100%;
			left: 0;
		}

		ion-item.chat-bg {
			width: 100%;
			--min-height: 48px;
			--background: var(--ion-color-light-shade)/*rgb(104 125 187 / 85%)*/!important;
			--border-radius: .5rem .5rem 0 0!important;
		}
	}

	@media (min-width: 992px) {
		.video-block {
			height: 50vh;
			max-height: 55vh;
		}

		.ios .video-block {
			max-height: 55vh;
		}

		.video-block.locale {
			display: block;
		}

		.video-block.locale-mini {
			display: none;
			width: 240px!important;
			height: 240px!important;
			margin: 0;
			border-radius: 0.5rem 0 .5rem;
			position: absolute;
			top: 4px;
			left: 4px;
		}

		.fixed-on-mobile {
			position: relative;
			bottom: 0;
			width: 100%;
			left: 0;
		}

		ion-item.chat-bg {
			width: 100%;
			--min-height: 48px;
			--background: var(--ion-color-light-shade)/*rgb(104 125 187 / 85%)*/!important;
			--border-radius: .5rem .5rem 0 0!important;
		}
	}

	.message {
		padding: 10px !important;
		transition: all 250ms ease-in-out !important;
		border-radius: 10px !important;
		margin-bottom: 4px !important;
	}

	.my {
		background-color: var(--ion-color-theme) !important;
		color: var(--ion-color-theme-contrast) !important;
	}

	.other {
		background-color: var(--ion-color-light-shade) !important;
		color: var(--ion-color-light-contrast) !important;
	}

	.other > .user_name, .time {
		color: var(--ion-color-theme);
		font-weight: bold;
	}

	.time {
		top: 2px;
		float: right;
		font-size: small;
		position: relative;
	}

	.message_row {
		background-color: #fff;
	}

	div > ion-fab-button {
		margin: 4px;
	}

	ion-grid.container-messages {
		overflow-y: scroll;
		max-height: 151px;
		-ms-overflow-style: none;
		opacity: .9;
		z-index: 1;
		display: flex;
		position: fixed;
		bottom: 210px;
		left: 10px;		
	}

	ion-grid.container-messages.ios {
		bottom: 255px;
		max-height: 140px;
	}

	.list-messages {
		width: 300px;
	}

	.list-message {
		border-radius: .2rem;
		/*background: rgb(0 0 0 / 35%);*/
		padding: 4px;
		/*box-shadow: 1px 2px 6px #00000040;*/
	}

	span.list-name {
		width: 100%;
		color: var(--ion-color-theme);
		font-weight: bold;
		/*display: inline-block;*/
	}

	span.list-text {
		margin-left: 0px;
		color: var(--ion-color-light);
	}
</style>