// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { Middleware, TurnContext, ActivityTypes } from 'botbuilder';
import { ContentModeratorClient } from 'azure-cognitiveservices-contentmoderator';
import { Screen } from 'azure-cognitiveservices-contentmoderator/lib/models';
import { CognitiveServicesCredentials } from 'ms-rest-azure';
import { Readable } from 'stream';

export class ContentModeratorMiddleware implements Middleware {
    // Key for Text Moderator result in Bot Context dictionary.
    public static readonly ServiceName: string = 'ContentModerator';
    // Key for Text Moderator result in Bot Context dictionary.
    public static readonly TextModeratorResultKey: string = 'TextModeratorResult';

    private readonly _cmClient: ContentModeratorClient;

    constructor(subscriptionKey: string, region: string) {
        this._cmClient = new ContentModeratorClient(new CognitiveServicesCredentials(subscriptionKey), `https://${region}.api.cognitive.microsoft.com`);
    }
    
    async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        if (context === null) {
            throw new Error('context is null');
        }

        if (context.activity.type === ActivityTypes.Message) {
            const content = new Readable();
            content.push(context.activity.text);
            content.push(null);
            const screenResult: Screen = await this._cmClient.textModeration.screenText('text/plain', content, { language: 'eng', autocorrect: true, pII: true, classify: true });

            context.turnState.set(ContentModeratorMiddleware.TextModeratorResultKey, screenResult);
        }

        await next();
    }

}