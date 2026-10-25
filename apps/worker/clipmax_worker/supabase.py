"""Small, explicit PostgREST client for the worker.

The worker uses the service-role key and bypasses RLS by design. Keeping the client here (instead of
pulling a large SDK) makes every table/RPC call visible and easy to audit.
"""

from __future__ import annotations

from typing import Any, cast

import httpx


class SupabaseError(RuntimeError):
    """A non-2xx PostgREST response or a transport failure."""


class SupabaseRest:
    def __init__(self, url: str, service_role_key: str, *, timeout_seconds: float = 60.0) -> None:
        self._base_url = f"{url.rstrip('/')}/rest/v1"
        self._client = httpx.Client(
            timeout=httpx.Timeout(timeout_seconds),
            headers={
                "apikey": service_role_key,
                "Authorization": f"Bearer {service_role_key}",
                "Content-Type": "application/json",
            },
        )

    def close(self) -> None:
        self._client.close()

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: list[tuple[str, str]] | None = None,
        json: Any | None = None,
        headers: dict[str, str] | None = None,
        timeout: float | None = None,
    ) -> Any:
        try:
            query_params = httpx.QueryParams(cast(Any, params)) if params is not None else None
            response = self._client.request(
                method,
                f"{self._base_url}{path}",
                params=query_params,
                json=json,
                headers=headers,
                timeout=timeout,
            )
        except httpx.HTTPError as exc:
            raise SupabaseError(f"{method} {path} failed: {exc}") from exc

        if response.is_error:
            body = response.text[:600]
            raise SupabaseError(f"{method} {path} -> {response.status_code}: {body}")

        if not response.content:
            return None
        return response.json()

    def rpc(self, name: str, params: dict[str, Any]) -> Any:
        return self._request("POST", f"/rpc/{name}", json=params)

    def select(
        self,
        table: str,
        params: list[tuple[str, str]] | None = None,
    ) -> list[dict[str, Any]]:
        query: list[tuple[str, str]] = [("select", "*")]
        if params:
            query.extend(params)
        data = self._request("GET", f"/{table}", params=query)
        return cast(list[dict[str, Any]], data or [])

    def select_one(
        self,
        table: str,
        params: list[tuple[str, str]],
    ) -> dict[str, Any] | None:
        rows = self.select(table, [*params, ("limit", "1")])
        return rows[0] if rows else None

    def insert(self, table: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        data = self._request(
            "POST",
            f"/{table}",
            json=rows,
            headers={"Prefer": "return=representation"},
        )
        return cast(list[dict[str, Any]], data or [])

    def upsert(
        self,
        table: str,
        rows: list[dict[str, Any]],
        *,
        on_conflict: str,
    ) -> list[dict[str, Any]]:
        data = self._request(
            "POST",
            f"/{table}",
            params=[("on_conflict", on_conflict)],
            json=rows,
            headers={"Prefer": "resolution=merge-duplicates,return=representation"},
        )
        return cast(list[dict[str, Any]], data or [])

    def update(
        self,
        table: str,
        params: list[tuple[str, str]],
        values: dict[str, Any],
    ) -> None:
        self._request(
            "PATCH",
            f"/{table}",
            params=params,
            json=values,
            headers={"Prefer": "return=minimal"},
        )

    def delete(self, table: str, params: list[tuple[str, str]]) -> None:
        self._request("DELETE", f"/{table}", params=params)
