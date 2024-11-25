-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Colors table to store unique colors
CREATE TABLE colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    hex_code CHAR(7) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, hex_code)
);

-- Episodes table to store main episode information
CREATE TABLE episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_number INTEGER NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    season INTEGER NOT NULL,
    episode INTEGER NOT NULL,
    youtube_url TEXT,
    painting_image_url TEXT,
    air_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Elements table to store painting elements (trees, mountains, etc.)
CREATE TABLE elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for episodes and colors
CREATE TABLE episode_colors (
    episode_id UUID REFERENCES episodes(id),
    color_id UUID REFERENCES colors(id),
    PRIMARY KEY (episode_id, color_id)
);

-- Junction table for episodes and elements
CREATE TABLE episode_elements (
    episode_id UUID REFERENCES episodes(id),
    element_id UUID REFERENCES elements(id),
    PRIMARY KEY (episode_id, element_id)
);

-- Insert common elements
INSERT INTO elements (name) VALUES
('tree'), ('mountain'), ('ocean'), ('lake'), ('clouds'),
('grass'), ('rocks'), ('bushes'), ('cabin'), ('waterfall');