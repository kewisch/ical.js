declare module 'src/interfaces/ical.js' {
  function parse(input: string): any[];

  export class helpers {
    public static updateTimezones(vcal: Component): Component;
  }

  class Component {
    public static fromString(str: string): Component;

    public name: string;

    constructor(jCal: any[] | string, parent?: Component);

    public toJSON(): any[];

    public getFirstSubcomponent(name?: string): Component | null;

    public getAllSubcomponents(name?: string): Component[];

    public getFirstPropertyValue<T = any>(name?: string): T;

    public getFirstProperty(name?: string): Property;

    public getAllProperties(name?: string): Property[];

    public addProperty(property: Property): Property;

    public addPropertyWithValue(
      name: string,
      value: string | number | object,
    ): Property;

    public updatePropertyWithValue(
      name: string,
      value: string | number | object,
    ): Property;

    public removeAllProperties(name?: string): boolean;

    public addSubcomponent(component: Component): Component;
  }

  export class Event {
    public uid: string;
    public summary: string;
    public startDate: Time;
    public endDate: Time;
    public description: string;
    public location: string;
    public attendees: Property[];

    public component: Component;

    public constructor(
      component?: Component | null,
      options?: { strictExceptions: boolean; exepctions: Array<Component | Event> },
    );

    public isRecurring(): boolean;

    public iterator(startTime?: Time): RecurExpansion;
  }

  export class Property {
    public name: string;
    public type: string;

    constructor(jCal: any[] | string, parent?: Component);

    public getFirstValue<T = any>(): T;

    public getValues<T = any>(): T[];

    public setParameter(name: string, value: string | string[]): void;

    public setValue(value: string | object): void;

    public setValues(values: (string | object)[]): void;

    public toJSON(): any;
  }

  interface TimeJsonData {
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
    isDate?: boolean;
  }

  export class Time {
    public static fromString(str: string): Time;

    public static fromJSDate(aDate: Date | null, useUTC: boolean): Time;

    public static fromData(aData: TimeJsonData): Time;

    public static now(): Time;

    public isDate: boolean;
    public timezone: string;
    public zone: Timezone;

    public year: number;
    public month: number;
    public day: number;
    public hour: number;
    public minute: number;
    public second: number;

    constructor(data?: TimeJsonData);

    public compare(aOther: Time): number;

    public clone(): Time;

    public convertToZone(zone: Timezone): Time;

    public adjust(
      aExtraDays: number,
      aExtraHours: number,
      aExtraMinutes: number,
      aExtraSeconds: number,
      aTimeopt?: Time,
    ): void;

    public addDuration(aDuration: Duration): void;

    public subtractDateTz(aDate: Time): Duration;

    public toUnixTime(): number;

    public toJSDate(): Date;

    public toJSON(): TimeJsonData;
  }

  export class Duration {
    public days: number;
  }

  export class RecurExpansion {
    public complete: boolean;

    public next(): Time;
  }

  export class Timezone {
    public static utcTimezone: Timezone;
    public static localTimezone: Timezone;

    public static convert_time(tt: Time, fromZone: Timezone, toZone: Timezone): Time;

    public tzid: string;
    public component: Component;

    constructor(
      data:
        | Component
        | {
            component: string | Component;
            tzid?: string;
            location?: string;
            tznames?: string;
            latitude?: number;
            longitude?: number;
          },
    );
  }

  export class TimezoneService {
    public static get(tzid: string): Timezone | null;

    public static has(tzid: string): boolean;

    public static register(tzid: string, zone: Timezone | Component);

    public static remove(tzid: string): Timezone | null;
  }

  export type FrequencyValues =
    | 'YEARLY'
    | 'MONTHLY'
    | 'WEEKLY'
    | 'DAILY'
    | 'HOURLY'
    | 'MINUTELY'
    | 'SECONDLY';

  export enum WeekDay {
    SU = 1,
    MO,
    TU,
    WE,
    TH,
    FR,
    SA,
  }

  export class RecurData {
    public freq?: FrequencyValues;
    public interval?: number;
    public wkst?: WeekDay;
    public until?: Time;
    public count?: number;
    public bysecond?: number[] | number;
    public byminute?: number[] | number;
    public byhour?: number[] | number;
    public byday?: string[] | string;
    public bymonthday?: number[] | number;
    public byyearday?: number[] | number;
    public byweekno?: number[] | number;
    public bymonth?: number[] | number;
    public bysetpos?: number[] | number;
  }

  export class RecurIterator {
    public next(): Time;
  }

  export class Recur {
    constructor(data?: RecurData);

    public until: Time | null;
    public freq: FrequencyValues;
    public count: number | null;

    public clone(): Recur;

    public toJSON(): Omit<RecurData, 'until'> & { until?: string };

    public iterator(startTime?: Time): RecurIterator;

    public isByCount(): boolean;
  }
}
