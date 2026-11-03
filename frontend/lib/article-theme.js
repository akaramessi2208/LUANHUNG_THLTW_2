const articleThemes = {
    'bat-dau-lap-rap-mo-hinh-mecha': {
        image: '/images/mecha-model-photo.jpg',
        topic: 'Hướng dẫn lắp ráp',
    },
    'chon-ti-le-mo-hinh-phu-hop': {
        image: '/images/mecha-aster.jpg',
        topic: 'Trưng bày mô hình',
    },
    'tao-duong-panel-hoan-thien-mo-hinh': {
        image: '/images/mecha-decals.jpg',
        topic: 'Kỹ thuật sơn & hoàn thiện',
    },
    'bao-quan-mo-hinh-trung-bay': {
        image: '/images/mecha-figure-photo.jpg',
        topic: 'Trưng bày mô hình',
    },
    'lap-rap-mo-hinh-an-toan': {
        image: '/images/mecha-tools.jpg',
        topic: 'Hướng dẫn lắp ráp',
    },
};
export function getArticleTheme(slug) {
    return articleThemes[slug] ?? null;
}
export function getArticleImage(slug, image) {
    const theme = getArticleTheme(slug);
    if (theme && (!image || image === '/images/mecha-hangar.jpg'))
        return theme.image;
    return image || '/images/gunpla-model-sprues.jpg';
}
export function getArticleTopic(slug, topic) {
    return getArticleTheme(slug)?.topic ?? topic ?? 'Góc xưởng';
}
