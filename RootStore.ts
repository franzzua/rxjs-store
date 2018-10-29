import {ObservableStore} from './ObservableStore';
import {Store, applyMiddleware, createStore, Middleware, Action, StoreEnhancer} from 'redux';
import {ActionsObservable, createEpicMiddleware} from 'redux-observable';
import {NgRedux} from '@angular-redux/store';
import {Fn} from '../functions/Fn';
import {catchError, flatMap, publishReplay, refCount, filter, map} from 'rxjs/operators'
import {NEVER} from 'rxjs';
import {Observable} from 'rxjs';
import {BaseStore} from './BaseStore';
import {Injectable} from '@angular/core';
import {Subject} from "rxjs";

export class DevToolEnhancer {
    public Enhance(storeEnhancer: StoreEnhancer) {
        return storeEnhancer;
    }
}

const adapter = {
    input: (input$: Observable<any>) => {
        return Object.assign(input$, {
            subscribeCore: obs => input$.subscribe(obs),
            ofType: (...keys) => input$.pipe(filter(action => {
                const type = action.type;
                const len = keys.length;

                if (len === 1) {
                    return type === keys[0];
                } else {
                    for (let i = 0; i < len; i++) {
                        if (keys[i] === type) {
                            return true;
                        }
                    }
                }
                return false;
            }))
        });
    },
    output: (output$: any) => output$
}

/**
 * Created by xamidylin on 20.06.2017.
 */
@Injectable()
export class RootStore extends ObservableStore<any> {
    constructor(ngRedux: NgRedux<any>, private devToolEnhancers: DevToolEnhancer) {
        super(null, null);
        this.ngRedux = ngRedux;
    }

    private store: Store<any>;

    public selector = Fn.I;

    public initStore(state?: any): Store<any> {
        if (state)
            this.dispatch({
                type: 'newState',
                payload: state
            });
        return this.store;
    }

    public createStore(state?: any): Store<any> {
        if (this.store) {
            if (state)
                this.dispatch({
                    type: 'newState',
                    payload: state
                });
            return this.store;
        }
        console.log('store');
        const epicMiddleware = createEpicMiddleware({
            adapter: adapter
        });
        const store = <Store<any>> createStore(
            this.combinedReducer,
            state,
            this.devToolEnhancers.Enhance(applyMiddleware(
                epicMiddleware,
                this.getLogMiddleware(),
                ...this.getOtherMiddlewares()))
            )
        ;
        epicMiddleware.run(this.epic$);
        this.ngRedux.provideStore(store);
        // state && state.History && state.History.forEach(this.ngRedux.dispatch);
        return this.store = store;
    }

    public dispatch<A extends Action>(a: A) {
        return this.ngRedux.dispatch(a);
    }

    public getState() {
        return this.ngRedux.getState();
    }

    private _epicRegistrator;
    protected get epicRegistrator() {
        return this._epicRegistrator;
    }

    //to convert actions deep-out hierarchy of stores
    private upgradeActions(action$: Observable<Action>, path) {
        return action$.pipe(
            map(a => Object.assign({}, a, {
                type: `${path}.${a.type}`
            }))
        );
    }

    //to convert actions deep-into hierarchy of stores
    private downgradeActions(action$: Observable<Action>, path) {
        return action$.pipe(
            filter(a => a.type.startsWith(path)),
            map(a => Object.assign({}, a, {
                type: a.type.substr((path.length || -1) + 1)
            }))
        );
    }

    private epic$ = (action$: ActionsObservable<any>) => {
        const actionSubject = new Subject<Observable<any>>();
        //replay actions for epics dynamically loaded in future
        const replayActions$ = action$.pipe(publishReplay(), refCount());
        replayActions$.subscribe();
        this._epicRegistrator = (epic, store: BaseStore<any>) => {
            const path = store.path.join('.');
            const downgraded = this.downgradeActions(replayActions$, path);
            const result = epic(downgraded, store);
            const upgraded = this.upgradeActions(result, path);
            const catched = upgraded.pipe(
                catchError(e => {
                    console.log(e);
                    return NEVER;
                }));
            return actionSubject.next(catched);
        };
        for (let key in this.StoresMap) {
            this.epicRegistrator(this.StoresMap[key].epic.epic$, this.StoresMap[key]);
        }
        this.epicRegistrator(this.epic.epic$, this);
        return actionSubject.asObservable().pipe(flatMap(Fn.I));
    };

    public getLogMiddleware() {
        return store => next => action => {
            // global['actions'] = [action, ...(global['actions'] || [])];
            // global['state'] = store.getState();
            return next(action);
        };
    }

    public getOtherMiddlewares(): Middleware[] {
        return [];
    }

    //
    // public getEpicsMiddleware(): Middleware {
    //     const epicMiddleware = createEpicMiddleware();
    //     epicMiddleware.run(this.epic$, {
    //         adapter: {
    //             input: (input$: Observable<any>) => {
    //                 return Object.assign(input$, {
    //                     subscribeCore: obs => input$.subscribe(obs),
    //                     ofType: (...keys) => input$.pipe(filter(action => {
    //                         const type = action.type;
    //                         const len = keys.length;
    //
    //                         if (len === 1) {
    //                             return type === keys[0];
    //                         } else {
    //                             for (let i = 0; i < len; i++) {
    //                                 if (keys[i] === type) {
    //                                     return true;
    //                                 }
    //                             }
    //                         }
    //                         return false;
    //                     }))
    //                 });
    //             },
    //             output: (output$: any) => output$
    //         }
    //     });
    //     return epicMiddleware;
    // }
}
