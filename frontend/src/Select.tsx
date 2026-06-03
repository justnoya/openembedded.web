import { StylesConfig } from 'react-select/dist/declarations/src/styles';

export const select_styles: StylesConfig = {
    control: (provided, { isFocused }) => ({
        ...provided,
        background: 'var(--bg-input, #1E1F22)',
        border: isFocused
            ? '1px solid var(--discord-blurple, #5865F2)'
            : '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: isFocused
            ? '0 0 0 2px rgba(88, 101, 242, 0.2)'
            : '0 1px 0 rgba(4,4,5,0.2)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'border-color 100ms, box-shadow 100ms',
        "&:hover": {
            borderColor: isFocused
                ? 'var(--discord-blurple, #5865F2)'
                : 'rgba(255, 255, 255, 0.14)',
        }
    }),

    option: (provided, { isSelected, isFocused }) => {
        let backgroundColor = 'transparent';
        let borderColor = 'transparent';

        if (isSelected) {
            backgroundColor = 'rgba(88, 101, 242, 0.25)';
            borderColor = 'rgba(88, 101, 242, 0.5)';
        } else if (isFocused) {
            backgroundColor = 'var(--discord-blurple, #5865F2)';
            borderColor = 'transparent';
        }

        return {
            ...provided,
            alignItems: 'center',
            display: 'flex',
            cursor: 'pointer',
            border: `1px solid ${borderColor}`,
            borderRadius: '4px',
            padding: '0.7rem 1rem',
            margin: '2px 0',
            width: '100%',
            color: '#FFFFFF',
            backgroundColor,
            transition: 'background 100ms',
        };
    },

    menu: (provided) => ({
        ...provided,
        marginTop: '0.4rem',
        backgroundColor: 'var(--bg-floating, #18191C)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '8px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.24)',
        overflow: 'hidden',
    }),

    menuList: () => ({
        padding: '0.6rem',
    }),

    valueContainer: (provided) => ({
        ...provided,
        padding: '0.8rem 1.4rem',
    }),

    singleValue: (provided) => ({
        ...provided,
        color: 'var(--text-normal, #DCDDDE)',
    }),

    placeholder: (provided) => ({
        ...provided,
        color: 'var(--text-faint, #72767D)',
        fontStyle: 'italic',
    }),

    input: (provided) => ({
        ...provided,
        color: 'var(--text-normal, #DCDDDE)',
        margin: undefined,
        paddingTop: undefined,
        paddingBottom: undefined,
    }),

    indicatorSeparator: (provided) => ({
        ...provided,
        display: 'none',
    }),

    dropdownIndicator: (provided) => ({
        ...provided,
        color: 'var(--interactive-normal, #B9BBBE)',
        padding: '0 1.2rem 0 0',
        transition: 'color 100ms',
        '&:hover': { color: 'var(--interactive-hover, #DCDDDE)' },
    }),

    loadingIndicator: (provided) => ({
        ...provided,
        color: 'var(--discord-blurple, #5865F2)',
    }),

    loadingMessage: (provided) => ({
        ...provided,
        color: 'var(--text-muted, #A3A6AA)',
        fontSize: '13px',
    }),

    noOptionsMessage: (provided) => ({
        ...provided,
        color: 'var(--text-faint, #72767D)',
        fontSize: '13px',
    }),
};
