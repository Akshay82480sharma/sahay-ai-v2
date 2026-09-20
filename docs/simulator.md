# Simulator

The Simulator module allows testing the Sahay AI emergency response logic by artificially generating incident reports and seeing how the dispatcher handles them.

## Security Guards

To prevent unauthorized generation of fake incidents in a production or publicly exposed environment, all `/simulate/*` routes are protected by strict security guards.

- **`SIMULATOR_ENABLED`**: Must be set to `true` in your environment (or `.env` file). If missing or set to `false`, the simulator endpoints will return `403 Forbidden`.
- **`ADMIN_TOKEN`**: A strict token requirement for all endpoints. Requests must include the `admin-token` header (e.g., `admin-token: your_token`) matching the `ADMIN_TOKEN` environment variable. If missing or mismatched, the endpoints will return `401 Unauthorized`.

These measures ensure the simulator can only be run intentionally and safely by authorized administrators.
