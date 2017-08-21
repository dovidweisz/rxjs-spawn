import { spawn } from 'child_process';
import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import 'rxjs/add/observable/bindNodeCallback';

export interface ChildProcess$ {
	stdIn? : Observer<string>;
	stdOut$?: Observable<Buffer>;
	stdErr$?: Observable<Buffer>;
}

export function SpawnChildRx( command, args?, options? ): ChildProcess${
	let stdio: [string, string, string] | string;
	if( args && args.stdio ) {
		stdio = args.stdio;
	}else{
		// if stdio is not set, use the default
		stdio = 'pipe';
	}
	if( typeof stdio === 'string' ){
		stdio = [stdio as string, stdio as string, stdio as string];
	}
	const [ stdin, stdout, stderr ] = stdio.map( opt => opt === 'pipe');

	const rv: ChildProcess$ = {};

	const _childProcess = spawn(command, args, options);

	if(stdin){
		rv.stdIn = {
			next: function(cmd){
				_childProcess.stdin.write(`${cmd}\n`);
			},
			error: (err: any) => {},
			complete: () => {},
		}
	}

	if(stdout){
		/*const onStdOut = Observable.bindNodeCallback(_childProcess.stdout.on);
		rv.stdOut$ = onStdOut('data');*/
		const stdOutSubject: Subject<Buffer> = new Subject;
		_childProcess.stdout.on('data', data => stdOutSubject.next(data as Buffer));
		rv.stdOut$ = stdOutSubject.asObservable();
	}

	if(stderr){
		/*const onStdErr = Observable.bindNodeCallback(_childProcess.stderr.on);
		rv.stdErr$ = onStdErr('data');*/
		const stdErrSubject: Subject<Buffer> = new Subject;
		_childProcess.stderr.on('data', data => stdErrSubject.next(data as Buffer));
		rv.stdErr$ = stdErrSubject.asObservable();
	}

	return rv;
}