import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
	{
		path: '',
		redirect: '/folder/Inbox'
	},
	{
		name: 'Settings',
		path: '/settings',
		component: () => import('@/views/Settings.vue')
	},
	{
		path: '/folder/:id',
		component: () => import ('../views/Folder.vue')
	}
];

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes
});

export default router;
