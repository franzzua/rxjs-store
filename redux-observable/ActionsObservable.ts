import {Observable} from 'rxjs/internal/Observable';
import {of} from 'rxjs/internal/observable/of';
import {from} from 'rxjs/internal/observable/from';
import {ofType} from './operators';
import {Operator} from "rxjs/internal/Operator";

export class ActionsObservable<T> extends Observable<T> {
    static of(...actions) {
        return new this(of(...actions));
    }

    static from(actions, scheduler) {
        return new this(from(actions, scheduler));
    }

    constructor(actionsSubject) {
        super();
        this.source = actionsSubject;
    }

    lift<R>(operator: Operator<T, R>): Observable<R> {
        const observable = new ActionsObservable<R>(this);
        observable.operator = operator;
        return observable as Observable<R>;
    }

    ofType(...keys) {
        return ofType(...keys)(this);
    }
}
