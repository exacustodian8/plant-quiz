import { HttpTestingController, TestRequest } from '@angular/common/http/testing';

/** A species the way Perenual returns it in species-list. */
export const raw = (id: number, name: string | null, withImage = true) => ({
  id,
  common_name: name,
  scientific_name: [`${name ?? 'unknown'} sp.`],
  family: 'Testaceae',
  default_image: withImage
    ? { regular_url: `https://img.test/${id}.jpg`, license_name: 'Attribution License (CC BY 2.0)', license_url: 'https://cc.test' }
    : null,
});

/** Premium-only species: a generic "upgrade" picture instead of a photo. */
export const rawLocked = (id: number, name: string) => ({
  ...raw(id, name),
  default_image: { regular_url: "https://s3.test/perenual/image/upgrade_access.jpg?X-Amz=1", license_name: "n/a", license_url: "" },
});

export const page = (data: ReturnType<typeof raw>[], over: Record<string, number> = {}) => ({
  data,
  total: data.length,
  last_page: 1,
  current_page: 1,
  ...over,
});

export const listRequest = (http: HttpTestingController, match: (r: TestRequest['request']) => boolean = () => true): TestRequest =>
  http.expectOne((r) => r.url.endsWith('/species-list') && match(r));

export const detailsRequest = (http: HttpTestingController, id: number): TestRequest =>
  http.expectOne((r) => r.url.endsWith(`/species/details/${id}`));
