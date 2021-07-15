import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
	{
		name: 'Settings',
		path: '/settings',
		component: () => import('@/views/Settings.vue')
	},
	{
		name: 'Error',
		path: '/error',
		component: () => import('@/views/Error.vue')
	},
	{
		path: '/',
		component: () => import ('@/views/Folder.vue')
	}
];

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes
});

export default router;
