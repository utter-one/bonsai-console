/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import { VersionResponse } from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Version<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Returns content-addressed SHA-256 hashes of the REST and WebSocket API schemas. Hashes change only when the corresponding contract files change — not on every commit. Use these hashes to detect breaking or additive changes between server deployments. No authentication required.
   *
   * @tags System
   * @name VersionList
   * @summary Get API schema version hashes
   * @request GET:/version
   */
  versionList = (params: RequestParams = {}) =>
    this.request<VersionResponse, any>({
      path: `/version`,
      method: "GET",
      format: "json",
      ...params,
    });
}
