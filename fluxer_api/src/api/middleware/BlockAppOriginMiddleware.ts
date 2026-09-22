// SPDX-License-Identifier: AGPL-3.0-or-later

import {InvalidApiOriginError} from '@fluxer/errors/src/domains/core/InvalidApiOriginError';
import type {Context, Next} from 'hono';

export async function BlockAppOriginMiddleware(ctx: Context, next: Next) {
	const origin = ctx.req.header('origin');
	if (origin === 'https://fluxer.cameronjolly.com' || origin === 'https://fluxer.cameronjolly.com') {
		throw new InvalidApiOriginError();
	}
	await next();
}
