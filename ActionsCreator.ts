import { NgRedux } from '@angular-redux/store';
import { Action } from 'redux';
import { ReplaySubject } from 'rxjs';
/**
 * Created by xamidylin on 06.07.2017.
 */
export class ActionsCreator<T> {

	protected ngRedux: NgRedux<any>;
	protected path: (string | number)[] = [];

	protected get prefix() {
		return this.path.map(k => `${k}.`).join('');
	}

	public DIFF_ACTION = `diff`;
	public ONLOAD_ACTION = `onload`;
	public INIT_ACTION = `init`;
	public INIT_IF_NULL_ACTION = 'init_if_null';

	constructor() {

	}

	public Diff(diff) {
		return this.Action({
			type: this.DIFF_ACTION,
			payload: diff
		});
	}


	public Init(state) {
		return this.Action({
			type: this.INIT_ACTION,
			payload: state
		});
	}

	public InitIfNull(state) {
		return this.Action({
			type: this.INIT_IF_NULL_ACTION,
			payload: state
		});
	}

	public RouteAction(action) {
		if (typeof action === "string")
			return this.RouteAction({type: action}).type;
		return Object.assign({}, action, {
			type: `${this.prefix}${action.type}`
		});
	}

	public Action(action) {
		if (!this.ngRedux) {
			//если нету редукса, кидаем в очередь ожидания
			this.actionQueueSubject$.next(action);
			return;
		}
		const routedAction = this.RouteAction(action);
		this.dispatch(routedAction);
	}

	private dispatch(action) {
		if (this.ngRedux)
			return this.ngRedux.dispatch(action);
		//если нету редукса, ждем его
		this.actionQueueSubject$.next(action);
	}

	private actionQueueSubject$ = new ReplaySubject<Action>();
	private actionQueue = this.actionQueueSubject$.asObservable();

	public InitActionCreator(ngRedux, path, state = {}) {
		this.ngRedux = ngRedux;
		this.path = path;

		if(state == {}){
			this.InitIfNull(state);
		}else{
			this.InitIfNull(state);
		}

		this.actionQueue
			.subscribe(this.Action.bind(this));
		this.actionQueueSubject$.complete();
	}
}
