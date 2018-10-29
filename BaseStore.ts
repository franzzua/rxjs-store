import {Injectable} from "@angular/core";
import {NgRedux} from "@angular-redux/store";
import {Reducer, MiddlewareAPI, Action, Dispatch, AnyAction} from "redux";
import {Epic} from "redux-observable";
import {Fn} from "../functions/Fn";
import {downgradeAction, objectReducer} from "./reducers";
import {ActionsCreator} from "./ActionsCreator";
import {NEVER, Subject} from 'rxjs';

export class BaseStore<TState> implements MiddlewareAPI<Dispatch<AnyAction>, TState> {
    public path: (string | number)[] = [];
    public Actions = new ActionsCreator<TState>();
    protected parentStore: BaseStore<any>;
    protected ngRedux: NgRedux<TState>;
    protected StoresMap: {} = {};
    protected epic: { epic$: Epic<any, TState> } = {
        epic$: (action$, store) => NEVER
    };
    protected reducer: { reduce: Reducer<TState> } = {
        reduce: objectReducer<TState>(Fn.I)
    };

    constructor(parentStore: BaseStore<any>, protected key: string) {
        if (!parentStore)
        // костыль для rootStore
            return;
        this.parentStore = parentStore;
        this.ngRedux = this.parentStore.ngRedux;
        parentStore.Register(this, key);
        setTimeout(() => this.Init());
    }

    protected get epicRegistrator() {
        return this.parentStore.epicRegistrator;
    }

    protected get combinedReducer() {
        return (state: TState = <any>null, action) => {
            try {
                if (!action.type) return state;
                const keys = action.type.split(".");
                const key = keys[0];
                const targetStore: BaseStore<any> = this.StoresMap[key];
                if (!targetStore)
                    return this.reducer.reduce(state, action);
                const newSubState = targetStore.reduce(state && state[key] || null, downgradeAction(action));
                return Object.assign({}, state, {
                    [key]: newSubState
                });
            } catch (e) {
                console.log(e);
                return state;
            }
        };
    }

    public dispatch<A extends AnyAction>(action: A) {
        return this.ngRedux.dispatch(action);
    }

    public Register<TChildState>(childStore: BaseStore<TChildState>,
                                 key: string) {
        this.StoresMap[key] = childStore;
        childStore.path = [...this.path, key];
        // console.log('registered', childStore.path.join('.'));
        // setTimeout(() =>childStore.Init({}));
    }

    public reduce(state, action) {
        return this.combinedReducer(state, action);
    }

    public getState(): TState {
        return this.parentStore.getState()[this.key];
    }

    protected Init(state = {}) {
        // Object.keys(this.StoresMap).forEach(key => this.StoresMap[key].Init());
        this.Actions.InitActionCreator(this.ngRedux, this.path, state);
        this.epicRegistrator(this.epic.epic$, this);
        this.OnInit.next(state);
        this.OnInit.complete();
    }

    public OnInit = new Subject();
}
