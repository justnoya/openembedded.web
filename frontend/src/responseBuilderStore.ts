import { configureStore } from '@reduxjs/toolkit';
import { Component } from 'components-sdk';
import { displaySlice } from './state';

export function createResponseBuilderStore(initialData: Component[]) {
    return configureStore({
        reducer: { display: displaySlice.reducer },
        preloadedState: {
            display: {
                data: initialData,
                isDefault: false,
                webhookUrl: '',
                webhookResponse: null,
                showThread: false,
            }
        }
    });
}
