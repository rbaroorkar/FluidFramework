/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import "mocha";
import { strict as assert } from "assert";
import {
    MockFluidDataStoreRuntime, MockContainerRuntimeFactory, MockStorage,
} from "@fluidframework/test-runtime-utils";
import { SharedLog } from "../src/log";
import { SharedLogFactory } from "../src/factory";

describe("SharedLog", () => {
    describe("SharedLog in local state", () => {
        let log: SharedLog;
        let dataStoreRuntime: MockFluidDataStoreRuntime;

        beforeEach(async () => {
            dataStoreRuntime = new MockFluidDataStoreRuntime();
            dataStoreRuntime.local = true;
            log = new SharedLog("log", dataStoreRuntime, SharedLogFactory.Attributes);
            assert.equal(log.length, 0);
        });

        it("Can create a log", () => {
            assert.ok(log, "Could not create a log");
        });
    });

    describe("attached", () => {
        let log: SharedLog;
        let containterRuntimeFactory: MockContainerRuntimeFactory;

        beforeEach(() => {
            containterRuntimeFactory = new MockContainerRuntimeFactory();

            // Create and connect the first SharedMatrix.
            const dataStoreRuntime1 = new MockFluidDataStoreRuntime();
            log = new SharedLog("log", dataStoreRuntime1, SharedLogFactory.Attributes);
            log.connect({
                deltaConnection: containterRuntimeFactory
                    .createContainerRuntime(dataStoreRuntime1)
                    .createDeltaConnection(),
                objectStorage: new MockStorage(),
            });

            assert.equal(log.length, 0);
        });

        it("Works", async () => {
            for (let i = 0; i < (256 * 256 * 2); i++) {
                // Append the entry
                log.appendEntry(i);

                // Initially, the new entry is unacked
                assert.equal(log.ackedLength, i);
                assert.equal(log.length, i + 1);

                // Ensure we can read the unacked entry (currenly stored in the pending list)
                assert.equal(log.getEntry(i), i);

                // Processes the ack message
                containterRuntimeFactory.processAllMessages();

                // Entry should now be acked
                assert.equal(log.ackedLength, i + 1);
                assert.equal(log.length, i + 1);

                // Ensure we can still read it (now stored in the B-Tree)
                assert.equal(log.getEntry(i), i);
            }
        });
    });
});