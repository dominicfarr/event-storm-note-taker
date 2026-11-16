import { describe, expect, it } from 'vitest';
import { parseScoreArgs, usage } from './score-args';

describe('parseScoreArgs', () => {
	it('takes the Session and the Run', () => {
		expect(parseScoreArgs(['takeaway-6', 'run-a'])).toEqual({
			help: false,
			session: 'takeaway-6',
			run: 'run-a'
		});
	});

	it('takes the Session alone, so its Runs can be listed', () => {
		expect(parseScoreArgs(['takeaway-6'])).toEqual({
			help: false,
			session: 'takeaway-6',
			run: undefined
		});
	});

	it('asks for help with --help or -h, whatever else is given', () => {
		expect(parseScoreArgs(['--help'])).toEqual({ help: true });
		expect(parseScoreArgs(['takeaway-6', '-h'])).toEqual({ help: true });
	});

	it('says what is wrong with an unknown option, then how to use it', () => {
		expect(() => parseScoreArgs(['takeaway-6', '--rnu', 'run-a'])).toThrow(
			"Unknown option '--rnu' " + usage
		);
	});

	it('refuses a missing Session or extra words', () => {
		expect(() => parseScoreArgs([])).toThrow(usage);
		expect(() => parseScoreArgs(['takeaway-6', 'run-a', 'run-b'])).toThrow(usage);
	});
});
