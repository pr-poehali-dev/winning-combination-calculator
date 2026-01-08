CREATE TABLE IF NOT EXISTS combinations (
    id SERIAL PRIMARY KEY,
    numbers INTEGER[] NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_combinations_date ON combinations(date DESC);

INSERT INTO combinations (numbers, date) VALUES
    (ARRAY[7, 14, 23, 31, 42], '2026-01-07'),
    (ARRAY[3, 19, 27, 35, 44], '2026-01-06'),
    (ARRAY[11, 18, 22, 29, 41], '2026-01-05'),
    (ARRAY[5, 12, 23, 38, 45], '2026-01-04'),
    (ARRAY[8, 16, 24, 31, 39], '2026-01-03'),
    (ARRAY[2, 14, 21, 33, 42], '2026-01-02'),
    (ARRAY[9, 17, 25, 34, 43], '2026-01-01'),
    (ARRAY[4, 13, 23, 30, 41], '2025-12-31');