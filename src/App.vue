<template>
	<IonApp>
		<IonSplitPane contentId="main-content" content-id="main-content">
			<ion-menu v-if="false" contentId="main-content" content-id="main-content" type="push">
				<ion-content>
					<ion-list id="inbox-list">
						<ion-list-header>{{ user.name }}</ion-list-header>
						<ion-note></ion-note>
					</ion-list>
				</ion-content>
			</ion-menu>
			<ion-router-outlet id="main-content"></ion-router-outlet>
			<ion-modal
				backdrop-dismiss="false"
				css-class="auth-modal"
				:is-open="isOpenRef"
			>
				<AuthModal
					v-on:close-modal="closeModal($event)"
				></AuthModal>
			</ion-modal>
		</IonSplitPane>
	</IonApp>
</template>

<script lang="ts">
	import { 
		getCurrentInstance, 
		defineComponent, 
		onMounted, 
		ref,

	} from 'vue';

	import { useRoute } from 'vue-router';

	import { 
		IonApp, 
		IonModal, 
		IonContent, 
		IonList, 
		IonListHeader, 
		IonMenu, 
		IonNote, 
		IonRouterOutlet, 
		IonSplitPane,

	} from '@ionic/vue';
	
	import { 
		archiveOutline, 
		archiveSharp, 
		bookmarkOutline, 
		bookmarkSharp, 
		heartOutline, 
		heartSharp, 
		mailOutline, 
		mailSharp, 
		paperPlaneOutline, 
		paperPlaneSharp, 
		trashOutline, 
		trashSharp, 
		warningOutline, 
		warningSharp,

	} from 'ionicons/icons';

	import AuthModal from '@/components/AuthModal.vue';

	export default defineComponent({
		name: 'App',
		components: {
			IonApp, 
			IonModal,
			AuthModal,
			IonContent, 
			IonList, 
			IonListHeader, 
			IonMenu, 
			IonNote, 
			IonRouterOutlet, 
			IonSplitPane,
		},
		setup() {
			const route	    = useRoute();
			const isOpenRef = ref<boolean>(false);
			const vueApp    = getCurrentInstance();
			const eventBus  = vueApp?.appContext.config.globalProperties.eventBus;
			
			isOpenRef.value = localStorage.getItem('token') === null;
			
			const closeModal = (event: any) => {
				console.log('onCloseModal:', event);
				
				isOpenRef.value = false;
			};

			onMounted(() => {
				const theme = localStorage.getItem('theme') ?? 'light';
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
				const newColorScheme = prefersDark.matches ? "dark" : "light";
				
				console.log(newColorScheme, theme, prefersDark);
				
				localStorage.setItem('theme', theme);
				document.body.classList.toggle('dark', theme == 'dark');

				prefersDark.addEventListener('change', e => {
					const newColorScheme = e.matches ? "dark" : "light";

					localStorage.setItem('theme', newColorScheme);

					document.body.classList.toggle('dark', newColorScheme == 'dark');
				});

				eventBus.on('errorAuth', () => {
					console.log('errorAuth');

					isOpenRef.value = true;
				});
			});

			return { 
				isOpenRef,
				closeModal,
				archiveOutline, 
				archiveSharp, 
				bookmarkOutline, 
				bookmarkSharp, 
				heartOutline, 
				heartSharp, 
				mailOutline, 
				mailSharp, 
				paperPlaneOutline, 
				paperPlaneSharp, 
				trashOutline, 
				trashSharp, 
				warningOutline, 
				warningSharp,
				isSelected: (url: string) => url === route.path ? 'selected' : ''
			}
		}
	});
</script>

<style>
	ion-menu ion-content {
		--background: var(--ion-item-background, var(--ion-background-color, #fff));
	}

	ion-menu.md ion-content {
		--padding-start: 8px;
		--padding-end: 8px;
		--padding-top: 20px;
		--padding-bottom: 20px;
	}

	ion-menu.md ion-list {
		padding: 20px 0;
	}

	ion-menu.md ion-note {
		margin-bottom: 30px;
	}

	ion-menu.md ion-list-header,
	ion-menu.md ion-note {
		padding-left: 10px;
	}

	ion-menu.md ion-list#inbox-list {
		border-bottom: 1px solid var(--ion-color-step-150, #d7d8da);
	}

	ion-menu.md ion-list#inbox-list ion-list-header {
		font-size: 22px;
		font-weight: 600;

		min-height: 20px;
	}

	ion-menu.md ion-list#labels-list ion-list-header {
		font-size: 16px;

		margin-bottom: 18px;

		color: #757575;

		min-height: 26px;
	}

	ion-menu.md ion-item {
		--padding-start: 10px;
		--padding-end: 10px;
		border-radius: 4px;
	}

	ion-menu.md ion-item.selected {
		--background: rgba(var(--ion-color-primary-rgb), 0.14);
	}

	ion-menu.md ion-item.selected ion-icon {
		color: var(--ion-color-primary);
	}

	ion-menu.md ion-item ion-icon {
		color: #616e7e;
	}

	ion-menu.md ion-item ion-label {
		font-weight: 500;
	}

	ion-menu.ios ion-content {
		--padding-bottom: 20px;
	}

	ion-menu.ios ion-list {
		padding: 20px 0 0 0;
	}

	ion-menu.ios ion-note {
		line-height: 24px;
		margin-bottom: 20px;
	}

	ion-menu.ios ion-item {
		--padding-start: 16px;
		--padding-end: 16px;
		--min-height: 50px;
	}

	ion-menu.ios ion-item.selected ion-icon {
		color: var(--ion-color-primary);
	}

	ion-menu.ios ion-item ion-icon {
		font-size: 24px;
		color: #73849a;
	}

	ion-menu.ios ion-list#labels-list ion-list-header {
		margin-bottom: 8px;
	}

	ion-menu.ios ion-list-header,
	ion-menu.ios ion-note {
		padding-left: 16px;
		padding-right: 16px;
	}

	ion-menu.ios ion-note {
		margin-bottom: 8px;
	}

	ion-note {
		display: inline-block;
		font-size: 16px;

		color: var(--ion-color-medium-shade);
	}

	ion-item.selected {
		--color: var(--ion-color-primary);
	}

	.auth-modal .modal-wrapper {
		background: transparent!important;
		box-shadow: none!important;
	}
</style>