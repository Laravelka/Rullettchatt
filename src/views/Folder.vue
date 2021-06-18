<template>
	<ion-page>
		<ion-header :translucent="true">
			<ion-toolbar>
				<ion-buttons slot="start">
					<ion-menu-button auto-hide="false" color="theme"></ion-menu-button>
				</ion-buttons>
				<ion-title class="ion-text-center">Онлайн: {{ onlineRef }}</ion-title>
				<ion-buttons slot="end">
					<ion-button color="theme" router-link="/settings">
						<ion-icon class="icon-25" :icon="settingsOutline"></ion-icon>
					</ion-button>
				</ion-buttons>
			</ion-toolbar>
		</ion-header>
		
		<ion-content :fullscreen="true">
			<ion-header collapse="condense">
				<ion-toolbar>
					<ion-title size="large" class="ion-text-center">Онлайн: {{ onlineRef }}</ion-title>
				</ion-toolbar>
			</ion-header>
			<ion-grid>
				<ion-row>
					<ion-col size-md="6" size-xs="12">
						<div class="d-flex ion-justify-content-center">
							<div class="video-container w-100">
								<video
									v-if="isCallRemote"
									id="remoteVideo"
									ref="remoteVideo"
									webkit-playsinline
									playsinline
									autoplay
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
								class="video-block locale-mini"
							></video>
						</div>
						<div class="d-flex ion-justify-content-center">
							<ion-button v-if="!isConnectRef" color="theme" size="max" @click="connect, isConnectRef = !isConnectRef">Подключиться</ion-button>
							<ion-button v-else color="danger" size="max" @click="disconnect, isConnectRef = !isConnectRef">Отключиться</ion-button>
							<ion-button :disabled="!isConnectRef" color="success" size="max" @click="next">Пропустить</ion-button>
						</div>
					</ion-col>
					<ion-col size-md="6" size-xs="12">
						<div class="d-flex ion-justify-content-center mt-2">
							<video
								muted
								id="localVideo"
								ref="localVideo"
								webkit-playsinline
								playsinline
								autoplay
								class="video-block locale"
							></video>
						</div>
						<div class="d-flex ion-justify-content-center fixed-on-mobile">
							<ion-item class="chat-bg">
								<ion-icon color="theme" slot="start" class="icon-25" :icon="attachOutline"></ion-icon>
								
								<ion-input v-model="inputMessageRef"></ion-input>

								<ion-icon @click="sendMessage" color="theme" slot="end" class="icon-25" :icon="sendOutline"></ion-icon>
							</ion-item>
						</div>
						<ion-toast
							color="danger"
							:is-open="isErrorRef"
							:message="errorMessageRef"
							:duration="3000"
							@didDismiss="isErrorRef = false"
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
		IonToast,
		IonButtons, 
		IonContent, 
		IonHeader, 
		IonMenuButton, 
		IonPage, 
		IonTitle, 
		IonToolbar,
		IonButton,
		IonInput,
		IonItem,
		IonGrid,
		IonIcon,
		IonCol,
		IonRow,
		
	} from '@ionic/vue';
	
	import {
		settingsOutline,
		attachOutline,
		sendOutline,
		
	} from 'ionicons/icons';
	import { defineComponent, ref, onMounted } from 'vue';
	// import { InAppPurchase2 } from '@ionic-native/in-app-purchase-2';

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const SocketIoClient = require('socket.io-client');

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const SimpleSignalClient = require('simple-signal-client');

	export default defineComponent({
		name: 'Folder',
		components: {
			IonButtons,
			IonContent,
			IonHeader,
			IonToast,
			IonMenuButton,
			IonPage,
			IonTitle,
			IonToolbar,
			IonButton,
			IonInput,
			IonItem,
			IonGrid,
			IonIcon,
			IonCol,
			IonRow
		},
		setup() {
			const socket = SocketIoClient('localhost:5000');

			const localVideo = ref<any>(null);
			const remoteVideo = ref<any>(null);
			const localMiniVideo = ref<any>(null);

			const onlineRef = ref(0);
			const isErrorRef = ref(false);
			const isConnectRef = ref(false);

			const isCallRemote = ref(false);

			const inputMessageRef = ref<string>('');
			const errorMessageRef = ref<string>('');

			const sendMessage = () => {
				socket.emit('chatMessage', inputMessageRef.value);
			};

			onMounted(async() => {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
					video: true,
				});
				const videoTracks = stream.getVideoTracks();

				if (videoTracks.length === 0) {
					isErrorRef.value = true;
					errorMessageRef.value = 'Включите камеру или предоставьте доступ к ней.';
				} else {
					console.log(`Using video device: ${videoTracks[0].label}`);

					if (localVideo.value && localMiniVideo.value) {
						if ('srcObject' in localVideo.value && 'srcObject' in localMiniVideo.value) {
							localVideo.value.srcObject = stream;
							localMiniVideo.value.srcObject = stream;
						} else if (localVideo.value.src && localMiniVideo.value.src) {
							localVideo.value.src = window.URL.createObjectURL(stream);
							localMiniVideo.value.src = window.URL.createObjectURL(stream);
						}
					}

					const signalClient = new SimpleSignalClient(socket, {
						stream: stream
					});

					const getRandomId = (ids: any) => {
						ids = ids.filter((id: any) => { return id != signalClient.id });

						return ids[Math.floor(Math.random() * ids.length)];
					};

					const onPeer = (peer: any, localStream: any) => {
						peer.addStream(localStream);

						console.log('1) Отправляем локальный стрим:', localStream);

						peer.on('stream', (remoteStream: any) => {
							console.log('2) Получаем  стрим:', peer);
							
							if (remoteVideo.value) {
								if ('srcObject' in remoteVideo.value) {
									remoteVideo.value.srcObject = remoteStream;
								} else if (remoteVideo.value.src) {
									remoteVideo.value.src = window.URL.createObjectURL(remoteStream);
								}
							}

							peer.on('close', () => {
								isCallRemote.value = false;
							});
						});
					};

					signalClient.on('discover', async (allIDs: any) => {
						onlineRef.value = allIDs.length;
						
						console.log('1) Соединение...');
						
						isCallRemote.value = true;
						
						const id = getRandomId(allIDs);
						
						if (id !== undefined) { 
							console.log('connect me(' + signalClient.id + ') to (' + id + ')');

							const { peer } = await signalClient.connect(id);

							onPeer(peer, stream);
						} else {
							isErrorRef.value = true;
							errorMessageRef.value = 'Пользователей пока что нет.';
						}
					});

					signalClient.on('request', async (request: any) => {
						const { peer } = await request.accept(); // Accept the incoming request

						peer.addStream(stream);

						isCallRemote.value = true;

						console.log('2) Принимаем звонок:', peer);

						peer.on('stream', (remoteStream: any) => {
							console.log('3) Получаем стрим:', remoteStream);
							
							if (remoteVideo.value) {
								if ('srcObject' in remoteVideo.value) {
									remoteVideo.value.srcObject = remoteStream;
								} else if (remoteVideo.value.src) {
									remoteVideo.value.src = window.URL.createObjectURL(remoteStream);
								}
							}
							peer.on('close', () => {
								isCallRemote.value = false;
							});
						});
					});

					signalClient.on('disconnect', async (id: any) => {
						console.log('disconnected:', id);
					});

					signalClient.discover();
				}
			});
			

			const next = () => {
				//
			};

			return {
				errorMessageRef,
				inputMessageRef,
				settingsOutline,
				localMiniVideo,
				attachOutline,
				isConnectRef,
				isCallRemote,
				sendMessage,
				remoteVideo,
				sendOutline,
				isErrorRef,
				localVideo,
				onlineRef,
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

	.d-flex {
		display: flex!important;
	}

	ion-item.chat-bg {
		--border-radius: .5rem;
	}

	.video-block {
		background-image: linear-gradient(#999, #555);
		height: 80vh;
		max-height: 500px;
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
	}

	@media (max-width: 575.98px) {
		.chat-block {
			margin: 0 30px;
		}

		.video-block {
			max-height: 600px;
		}

		.video-block.locale {
			display: none;
		}

		.video-block.locale-mini {
			display: inline-block;
			width: 160px;
			height: 150px;
			margin: 0;
			border-radius: 0.5rem 0 .5rem;
			position: absolute;
			top: 5px;
			left: 5px;
		}

		.fixed-on-mobile {
			position: fixed;
			bottom: 0;
			width: 100%;
			left: 0;
		}

		ion-item.chat-bg {
			width: 100%;
			--min-height: 56px;
			/*--border-radius: .5rem .5rem 0 0!important;*/
		}
	}
</style>