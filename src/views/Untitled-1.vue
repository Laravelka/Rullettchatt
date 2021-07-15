<ion-button v-else color="danger" size="max" @click="peerInstance.destroy(), disconnect()">Отключиться</ion-button>

<ion-button :disabled="!isConnectRef" color="success" size="max" @click="peerInstance.destroy(), signal.discover(), next()">Пропустить</ion-button>