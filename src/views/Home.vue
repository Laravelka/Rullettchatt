<template>
	<ion-page>
		<Header :title="'Онлайн: ' + onlineRef"></Header>
		<ion-content :fullscreen="true">
			<ion-header collapse="condense">
				<ion-toolbar>
					<ion-title>Онлайн: {{ onlineRef ?? 0 }}</ion-title>
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
									v-if="isCalling"
									id="remoteVideo"
									ref="remoteVideo"
									webkit-playsinline
									playsinline
									autoplay
									@play="onPlayStream($event)"
									class="video-block remote-mini"
								></video>
								<div v-else id="remoteVideo" ref="remoteVideo" class="video-block remote-mini"></div>
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
							<ion-fab-button v-if="!isCalling" color="theme" @click="connect">
								<ion-icon :icon="powerOutline"></ion-icon>
							</ion-fab-button>
							<ion-fab-button v-else :disabled="!isCalling" color="danger" @click="disconnect">
								<ion-icon :icon="powerOutline"></ion-icon>
							</ion-fab-button>

							<ion-fab-button :disabled="!isCalling" color="danger" @click="banUser">
								<ion-icon :icon="banOutline"></ion-icon>
							</ion-fab-button>

							<ion-fab-button :disabled="!isCalling || remainingTime != 0 || !peerRef" color="success" @click="next">
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
									<transition name="fade">
										<ion-col v-if="message.name != user.name" size="9" class="message other">
											<span class="user_name">{{ message.name }}</span><br>
											<span>{{ message.text }}</span>
										</ion-col>
										<ion-col v-else-if="message.name == user.name" ref="(arrMessages.length == (index+1) ? lastMessage : null)" offset="3" size="9" class="message my">
											<span>{{ message.text }}</span>
										</ion-col>
									</transition>
								</ion-row>
							</ion-grid>
						</div>
						<div class="d-flex ion-justify-content-center fixed-on-mobile mt-05 chat-input">
							<ion-item class="chat-bg">
								<ion-icon color="theme" :disabled="!isConnectChat" slot="start" class="icon-25" :icon="attachOutline"></ion-icon>
								
								<ion-input v-model="inputMessageRef" :disabled="!isConnectChat"></ion-input>

								<ion-icon @click="message" v-on:keyup.enter="message" :disabled="!isConnectChat" color="theme" slot="end" class="icon-25" :icon="paperPlaneOutline"></ion-icon>
							</ion-item>
						</div>
						<ion-toast
							:color="toastColorRef"
							:is-open="isOpenToast"
							:message="toastMessageRef"
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
		// IonSkeletonText,
		IonFabButton,
		IonToast, 
		// IonSpinner,
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
		banOutline,
		// sendOutline,

	} from 'ionicons/icons';
	// import { App } from '@capacitor/app';
	import { Device } from '@capacitor/device';
	import { defineComponent, ref, getCurrentInstance } from 'vue';
	// import { InAppPurchase2 } from '@ionic-native/in-app-purchase-2';

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const SocketIoClient = require('socket.io-client');

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	// const WebRTCPeerClient = require('webrtc-peer-client');

	import Header from '@/components/Header.vue';
	// import { useRouter } from 'vue-router';
	import axios from 'axios';
	import Peer from 'peerjs';

	export default defineComponent({
		name: 'Home',
		components: {
			// IonSkeletonText,
			IonFabButton,
			IonContent,
			// IonSpinner,
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
			// const router   = useRouter();
			const vueApp   = getCurrentInstance();
			const getUser  = localStorage.getItem('user');
			const token    = localStorage.getItem('token');
			let   socket   = SocketIoClient(axios.defaults.headers.common['SiteUrl'], {
				query: {
					token: token
				}
			});	
			const eventBus = vueApp?.appContext.config.globalProperties.eventBus;

			const user = ref<any>({});
			const isCalling = ref<boolean>(false);
			const isConnect = ref<boolean>(false);
			const isConnectChat = ref<boolean>(false);

			const callRef = ref<any>();
			const peerRef = ref<any>();
			const onlineRef = ref(0);
			const requestRef = ref<any>();
			const peersData = ref<any>({});
            const remainingTime = ref(0);
			const callAnswerRef = ref<any>();

            const isOpenToast = ref<boolean>(false);
            const toastColorRef = ref<string|null>('');
            const inputMessageRef = ref<string|null>('');
            const toastMessageRef = ref<string|null>('');

            const arrMessages = ref<any>([]);
            const lastMessage = ref<any>(null);
            const lastMessageMobile = ref<any>(null);
            
			const streamRef = ref<any>(null);
            const localVideo = ref<any>(null);
			const remoteVideo = ref<any>(null);
			const localMiniVideo = ref<any>(null);

			
			const lastUserId = ref<any>();
			const remoteUserId = ref<any>();

			const rand = (min: number, max: number) => {
				return Math.floor(Math.random() * (max - min + 1) + min);
			};

			window.addEventListener('resize', (event: UIEvent) => {
				console.log(event);
			});

			const startStreaming = async(user: any) => {
				const info = await Device.getInfo();

				let video = {};
				if (info.operatingSystem == 'windows') {
					video = {
						width: { min: 560, ideal: 1280, max: 1920 },
						height: { min: 640, ideal: 720, max: 1080 }
					};
				} else {
					video = {
						width: { min: 560, ideal: 1280, max: 1920 },
						height: { min: 640, ideal: 720, max: 1080 }
					};
				}

				streamRef.value = await navigator.mediaDevices.getUserMedia({
					audio: true,
					video: video
				}).then((stream: any) => {
					streamRef.value = stream;

					return stream;
				}).catch((reason: any) => {
					if (reason.name == 'NotAllowedError') {
						throw new Error('Предоставьте доступ к камере и перезапустите приложение/cайт.');
					} else if (reason.name == 'NotReadableError') {
						throw new Error('Произошла аппаратная ошибка на уровне операционной системы, браузера или веб-страницы, которая препятствовала доступу к устройству. Перезапустите приложение/cайт.');
					} else {
						throw new Error('Включите камеру, перезапустите ее или предоставьте доступ к ней и перезапустите приложение/cайт.');
					}
				});

				if (!streamRef.value) return;

				const localStream = streamRef.value;
				const videoTracks = localStream.getVideoTracks();

				if (videoTracks.length === 0) {
					isOpenToast.value = true;
					toastColorRef.value = 'danger';
					toastMessageRef.value = 'Включите камеру или предоставьте доступ к ней и перезапустите приложение/cайт.';
				} else {
					console.log(videoTracks);

					if (localVideo.value && localMiniVideo.value) {
						if ('srcObject' in localVideo.value && 'srcObject' in localMiniVideo.value) {
							localVideo.value.srcObject = localStream;
							localMiniVideo.value.srcObject = localStream;
						} else if (localVideo.value.src && localMiniVideo.value.src) {
							localVideo.value.src = window.URL.createObjectURL(localStream);
							localMiniVideo.value.src = window.URL.createObjectURL(localStream);
						}
					}

					const peer = peerRef.value = new Peer(user.id, {
						port: 5001,
						host: 'localhost',
						path: '/peerjs',
						key: 'rullettchatt',
						debug: 3,
						config: {
							iceServers: [
								{ urls: "stun:stun.l.google.com:19302" },
								{ urls: 'turn:numb.viagenie.ca:3478', username: 'zheka.9l@yandex.ru', credential: 'Qazxsw102' },
								{ urls: "turn:45.80.68.192:3478", username: "rullettchattApp", credential: "30a*cRk8r888m%))" }
							]
						}
					});

					peer.on('open', (id: string) => {
						console.log('PeerJs [on] open: id', id);
					});

					peer.on('call', (call) => {
						callAnswerRef.value = call;
						lastUserId.value = call.peer;
						remoteUserId.value = call.peer;

						console.log('[on] call:', call);
						
						call.answer(localStream);

						call.on('stream', (remoteStream: any) => {
							isCalling.value = true;

							if (remoteVideo.value) {
								if ('srcObject' in remoteVideo.value) {
									remoteVideo.value.srcObject = remoteStream;
								} else if (remoteVideo.value.src) {
									remoteVideo.value.src = window.URL.createObjectURL(remoteStream);
								}
							}
							console.log('Who called:', remoteStream);
						});
					});
					
					peer.on('connection', (connection) => {
						isConnectChat.value = true;
						console.log('dataConn:', connection);

						arrMessages.value = [];
						requestRef.value = connection;
						connection.on('data', async(data) => {
							isConnectChat.value = true;
							const checkUser = await axios.get('/user?id=' + (remoteUserId.value ?? 0));
							
							if (checkUser.data !== undefined && checkUser.data.user.name !== undefined) {
								arrMessages.value.push({
									text: data.message,
									name: checkUser.data.user.name
								});
							}

							setTimeout(() => {
								const element = document.getElementsByClassName('lastMessage')[0];
								const elementMobile = document.getElementsByClassName('lastMessageMobile')[0];

								element.scrollIntoView({ behavior: 'smooth' });
								elementMobile.scrollIntoView({ behavior: 'smooth' });
							}, 200);
						});

						connection.on('close', () => {
							console.log('coonection close');

							isCalling.value = false;
							remoteVideo.value = null;
							arrMessages.value = [];
							remoteUserId.value = null;
							isConnectChat.value = false;
						});

						connection.on('disconnected', () => {
							console.log('coonection disconnected');

							isCalling.value = false;
							remoteVideo.value = null;
							arrMessages.value = [];
							remoteUserId.value = null;
							isConnectChat.value = false;
						});
					});

					peer.on('error', (error: Error) => {
						isOpenToast.value = true;
						toastColorRef.value = 'danger';
						toastMessageRef.value = 'Ошибка WebRTC: ' + error.message;

						console.error('peerError:', error, error.name);
					});

					return {
						peer: peer
					};
				}
			};

            const onPlayStream = (event: any) => {
				event.target.style.backgroundImage = 'none';
			};
			
			socket.on('connect_error', (reason: any) => {
				isOpenToast.value = true;
				toastColorRef.value = 'danger';
				toastMessageRef.value = reason.message == 'xhr poll error' ? 'Ошибка подключения к серверу, переподключение...' : 'Неизвестная ошибка сервера.';

				setTimeout(() => {
					isOpenToast.value = false;
					toastColorRef.value = 'primary';
					toastMessageRef.value = '';
				}, 2800);
				console.error('Socket error:', reason.message);
			});

			socket.on('connect', () => {
				socket.on('errorMessage', (data: any) => {
					isOpenToast.value = true;
					toastColorRef.value = 'danger';
					toastMessageRef.value = data.text;

					if (data.type == 'auth_fail') {
						eventBus.emit('errorAuth');

						localStorage.removeItem('user');
						localStorage.removeItem('token');
					}

					setTimeout(() => {
						isOpenToast.value = false;
						toastColorRef.value = 'primary';
						toastMessageRef.value = '';
					}, 5000);
				});

				socket.on('updateOnline', (online: any) => {
					peersData.value = online;
					onlineRef.value = online.all.length;
				});
			});
			
			eventBus.on('login', (user: any) => {
				user.value = user;
				socket.disconnect();

				socket = SocketIoClient(axios.defaults.headers.common['SiteUrl'], {
					query: {
						token: user.token
					}
				});	

				startStreaming(user.value).then((streaming: any) => {
					peerRef.value = streaming.peer;

					console.log(streaming);
				}).catch((reason: Error) => {
					isOpenToast.value = true;
					toastColorRef.value = 'danger';
					toastMessageRef.value = reason.message;
				});
			});

			if (getUser !== null) {
				user.value = JSON.parse(getUser);

                startStreaming(user.value).then((streaming: any) => {
					peerRef.value = streaming.peer;

					console.log(streaming);
				}).catch((reason: Error) => {
					isOpenToast.value = true;
					toastColorRef.value = 'danger';
					toastMessageRef.value = reason.message;
				});
            }

			const connect = () => {
				const arrPeers = peersData.value.peers;

				arrMessages.value = [];

				if (arrPeers !== undefined && peerRef.value) {
					const peer = peerRef.value;
					const filteredPeers = arrPeers.filter((peerItem: any) => {
						return peerItem != user.value.id && peerItem != lastUserId.value;
					});
					console.log('filteredPeers:', filteredPeers);

					if (filteredPeers.length !== 0) {
						const randomPeerId = filteredPeers[rand(0, filteredPeers.length-1)];

						if (randomPeerId !== undefined  && !isCalling.value) {
							const call = callRef.value = peer.call(randomPeerId, streamRef.value);

							call.on('stream', (remoteStream: any) => {
								isCalling.value = true;
								lastUserId.value = randomPeerId;
								remoteUserId.value = randomPeerId;

								if (remoteVideo.value) {
									if ('srcObject' in remoteVideo.value) {
										remoteVideo.value.srcObject = remoteStream;
									} else if (remoteVideo.value.src) {
										remoteVideo.value.src = window.URL.createObjectURL(remoteStream);
									}
								}
							});
							const request = requestRef.value = peer.connect(randomPeerId);

							request.on('data', async(data: any) => {
								const checkUser: any = await axios.get('/user?id=' + randomPeerId);
								
								if (checkUser.data !== undefined && checkUser.data.user.name !== undefined) {
									arrMessages.value.push({
										name: checkUser.data.user.name,
										text: data.message
									});
								}

								setTimeout(() => {
									const element = document.getElementsByClassName('lastMessage')[0];
									const elementMobile = document.getElementsByClassName('lastMessageMobile')[0];

									element.scrollIntoView({ behavior: 'smooth' });
									elementMobile.scrollIntoView({ behavior: 'smooth' });
								}, 200);
								console.log("[on] data: ", data);
							});

							request.on('open', () => {
								isConnectChat.value = true;
								lastUserId.value = randomPeerId;
								remoteUserId.value = randomPeerId;
							});

							request.on('close', () => {
								console.log('request close');

								isCalling.value = false;
								remoteVideo.value = null;
								arrMessages.value = [];
								remoteUserId.value = null;
								isConnectChat.value = false;
							});

							request.on('disconnected', () => {
								console.log('request disconnected');

								isCalling.value = false;
								remoteVideo.value = null;
								arrMessages.value = [];
								remoteUserId.value = null;
								isConnectChat.value = false;
							});
						} else {
							isOpenToast.value = true;
							toastColorRef.value = 'primary';
							toastMessageRef.value = 'Свободных собеседников нет или у вы уже созвонились...';

							setTimeout(() => {
								isOpenToast.value = false;
								toastColorRef.value = 'primary';
								toastMessageRef.value = '';
							}, 4000);
						}
					} else {
						isOpenToast.value = true;
						toastColorRef.value = 'primary';
						toastMessageRef.value = 'Свободных собеседников нет, ожидаем...';

						setTimeout(() => {
							isOpenToast.value = false;
							toastColorRef.value = 'primary';
							toastMessageRef.value = '';
						}, 4000);
					}
				} else {
					isOpenToast.value = true;
					toastColorRef.value = 'primary';
					toastMessageRef.value = 'Свободных собеседников нет, ожидаем...';

					setTimeout(() => {
						isOpenToast.value = false;
						toastColorRef.value = 'primary';
						toastMessageRef.value = '';
					}, 4000);
				}
			};

			const message = () => {
				const request = requestRef.value;
				
				if (request !== undefined && inputMessageRef.value !== '' && user.value.id !== undefined) {
					request.send({
						message: inputMessageRef.value
					});
					arrMessages.value.push({
						name: user.value.name,
						text: inputMessageRef.value
					});
					inputMessageRef.value = null;

					setTimeout(() => {
						const element = document.getElementsByClassName('lastMessage')[0];
						const elementMobile = document.getElementsByClassName('lastMessageMobile')[0];

						element.scrollIntoView({ behavior: 'smooth' });
						elementMobile.scrollIntoView({ behavior: 'smooth' });
					}, 200);
				} else {
					isOpenToast.value = true;
					toastColorRef.value = 'danger';
					toastMessageRef.value = 'Сообщение не было отправлено, перезагрузите приложение/сайт...';

					setTimeout(() => {
						isOpenToast.value = false;
						toastColorRef.value = 'primary';
						toastMessageRef.value = '';
					}, 4000);
				}
			};

			const disconnect = () => {
				if (callRef.value != undefined) callRef.value.close();
				if (requestRef.value != undefined) requestRef.value.close();
				if (callAnswerRef.value != undefined) callAnswerRef.value.close();

				isCalling.value = false;
				remoteVideo.value = null;
				arrMessages.value = [];
				remoteUserId.value = null;
				isConnectChat.value = false;
			};

			const next = () => {
				disconnect();
				connect();
			};

			return {
				arrowForwardOutline,
				paperPlaneOutline,
				lastMessageMobile,
				toastMessageRef,
				inputMessageRef,
				settingsOutline,
				localMiniVideo,
				toastColorRef,
				remainingTime,
				attachOutline,
				isConnectChat,
				onPlayStream,
				powerOutline,
				remoteUserId,
				lastMessage,
				arrMessages,
				remoteVideo,
				// sendOutline,
				isOpenToast,
				localVideo,
				lastUserId,
				banOutline,
				disconnect,
				onlineRef,
				isConnect,
				isCalling,
				peerRef,
				connect,
				message,
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
			--border-radius: .5rem;
		}
	}

	.chat-messages {
		margin-top: .4rem;
		overflow-y: auto;
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
			overflow-y: auto;
			max-height: 245px;
		}

		.ios .chat-messages {
			margin-top: 0;
			overflow-y: auto;
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
			--border-radius: .5rem!important;
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
		overflow-y: auto;
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
		bottom: 260px;
		max-height: 105px;
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

	.fade-enter-active, .fade-leave-active {
		transition: opacity .5s
	}
	.fade-enter, .fade-leave-to /* .fade-leave-active до версии 2.1.8 */ {
		opacity: 0
	}
</style>