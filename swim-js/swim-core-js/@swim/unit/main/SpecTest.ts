// Copyright 2015-2019 SWIM.AI inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {TestException} from "./TestException";
import {TestFunc, TestOptions} from "./Test";
import {SpecClass, Spec} from "./Spec";
import {Proof} from "./Proof";
import {Report} from "./Report";
import {Exam} from "./Exam";

/**
 * Test function registration descriptor.  A `SpecTest` associates a [[TestFunc
 * test function]] with [[TestOptions test options]].  The [[run]] method
 * manages the–possibly asynchronous–evaluation of the test function in the
 * context of a particular `Spec` instance.
 */
export class SpecTest {
  /**
   * The name of this test.
   * @hidden
   */
  readonly _name: string;

  /**
   * The function used to evaluate this test.
   * @hidden
   */
  readonly _func: TestFunc;

  /**
   * Options that govern the execution of this test unit.
   * @hidden
   */
  readonly _options: TestOptions;

  constructor(name: string, func: TestFunc, options: TestOptions) {
    this._name = name;
    this._func = func;
    this._options = options;
  }

  /**
   * Returns the name of this test–typically the name of the underlying test
   * function.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Returns the function used to evaluate this test.
   */
  get func(): TestFunc {
    return this._func;
  }

  /**
   * Returns the options that govern the evaluation of this test.
   */
  get options(): TestOptions {
    return this._options;
  }

  /**
   * Lifecycle callback invoked before each evaluation of the test function.
   */
  willRunTest(report: Report, spec: Spec, exam: Exam): void {
    if (typeof spec.willRunTest === "function") {
      spec.willRunTest(report, exam);
    }
    report.willRunTest(spec, exam);
  }

  /**
   * Lifecycle callback invoked after the–possibly asynchronous–completion of
   * each evaluation of the test function.  The `result` of a synchronous test
   * is the return value of the test function, if the test passed, or the
   * thrown exception, if the test failed.  The `result` of an asynchronous
   * test is the fulfilled value, or the rejected reason, of the `Promise`
   * returned by the test function.
   */
  didRunTest(report: Report, spec: Spec, exam: Exam, result: unknown): void {
    report.didRunTest(spec, exam, result);
    if (typeof spec.didRunTest === "function") {
      spec.didRunTest(report, exam, result);
    }
  }

  /**
   * Evaluates the underlying test function as a method on the given
   * `spec`, generating the given `report`.  Returns a `Promise` that
   * completes with the `Exam` result, regardless of the success or failure
   * of the underlying test function.
   */
  run(report: Report, spec: Spec): Promise<Exam> {
    let exam;
    if (typeof spec.createExam === "function") {
      exam = spec.createExam(report, this._name, this._options);
    } else {
      exam = new Exam(report, spec, this._name, this._options);
    }
    try {
      this.willRunTest(report, spec, exam);
      let result;
      if (this._options.pending) {
        exam.pending();
      } else {
        result = this._func.call(spec, exam);
      }
      if (result instanceof Promise) {
        return result.then(this.runTestSuccess.bind(this, report, spec, exam),
                           this.runTestFailure.bind(this, report, spec, exam));
      } else {
        this.didRunTest(report, spec, exam, result);
        return Promise.resolve(exam);
      }
    } catch (error) {
      if (!(error instanceof TestException)) {
        exam.proove(Proof.error(error));
      }
      this.didRunTest(report, spec, exam, error);
      return Promise.resolve(exam);
    }
  }

  /**
   * Asynchronous completes the evaluation of a successful test.
   * @hidden
   */
  runTestSuccess(report: Report, spec: Spec, exam: Exam, result: unknown): Exam {
    this.didRunTest(report, spec, exam, result);
    return exam;
  }

  /**
   * Asynchronous completes the evaluation of a failed test.
   * @hidden
   */
  runTestFailure(report: Report, spec: Spec, exam: Exam, error: unknown): Exam {
    if (!(error instanceof TestException)) {
      exam.proove(Proof.error(error));
    }
    this.didRunTest(report, spec, exam, error);
    return exam;
  }

  /**
   * Curried [[Test]] method decorator, with captured `options`.
   * @hidden
   */
  static decorate(options: TestOptions, target: SpecClass, name: string,
                  descriptor: PropertyDescriptor): void {
    Spec.init(target);

    const test = new SpecTest(name, descriptor.value, options);
    target._tests!.push(test);
  }
}
